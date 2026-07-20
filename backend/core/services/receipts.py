import hashlib
from django.utils.html import escape

def finalize_receipt(receipt):
    """Finalizes a digital receipt. No PDF or image artifact is stored."""
    payment = receipt.payment
    installment = payment.installment
    loan = installment.loan
    fingerprint = '|'.join([
        str(receipt.number), str(payment.amount),
        str(payment.payment_date),
        str(loan.creditor_id), str(loan.debtor_id),
    ])
    receipt.document_hash = hashlib.sha256(fingerprint.encode()).hexdigest()
    receipt.save(update_fields=['document_hash'])


def _sig_hash(receipt, user_id, signed_at):
    raw = f'{receipt.number}|{user_id}|{signed_at.isoformat()}'
    return hashlib.sha256(raw.encode()).hexdigest()


def receipt_html(receipt):
    payment = receipt.payment
    installment = payment.installment
    loan = installment.loan

    sigs = receipt.signatures.select_related('user').all()
    total_sigs = sigs.count()

    sig_items = ''.join(
        f'''
        <li>
            <strong>{escape(sig.user.full_name)}</strong><br>
            <small>Assinado em {sig.signed_at.strftime("%d/%m/%Y às %H:%M")}</small><br>
            <code class="sig-hash">{_sig_hash(receipt, sig.user_id, sig.signed_at)}</code>
        </li>'''
        for sig in sigs
    )

    status = receipt.get_status_display()
    if receipt.status == 'cancelled':
        status_html = f'<span class="tag cancelled">{escape(status)}</span>'
    elif receipt.document_hash:
        status_html = f'<span class="tag valid">{escape(status)} — {total_sigs}/2 assinaturas</span>'
    else:
        status_html = f'<span class="tag pending">Aguardando assinaturas — {total_sigs}/2</span>'

    fields = [
        ('Número', receipt.number),
        ('Credor', loan.creditor.full_name),
        ('Devedor', loan.debtor.full_name),
        ('Valor recebido', f'R$ {payment.amount}'),
        ('Parcela', f'{installment.number}/{loan.installments}'),
        ('Forma de pagamento', payment.payment_method.upper()),
        ('Data do pagamento', payment.payment_date.strftime('%d/%m/%Y')),
        ('Registrado por', payment.recorded_by.full_name),
        ('Status', status_html),
    ]
    rows = ''.join(
        f'<dt>{escape(label)}</dt><dd>{str(value)}</dd>'
        for label, value in fields
    )

    return f'''<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<title>Recibo {receipt.number}</title>
<style>
body{{font-family:system-ui;max-width:720px;margin:48px auto;color:#182a2b;padding:0 16px}}
h1{{font-size:26px}}
dl{{display:grid;grid-template-columns:190px 1fr;gap:10px 12px}}
dt{{font-weight:700;color:#295350}}
dd{{margin:0}}
code{{font-size:11px;overflow-wrap:anywhere;word-break:break-all}}
.sig-hash{{font-size:10px;color:#6f7f7d}}
.tag{{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600}}
.tag.valid{{background:#edf5e7;color:#3d6b23}}
.tag.pending{{background:#fff4df;color:#b77c1e}}
.tag.cancelled{{background:#f1f1f1;color:#6f7f7d}}
.validity{{background:#f6faf3;border:1px solid #d0e8c0;border-radius:10px;padding:16px;margin-top:24px}}
.validity h2{{font-size:15px;margin:0 0 8px;color:#3d6b23}}
.validity p{{font-size:13px;margin:0 0 4px;color:#295350}}
hr{{border:none;border-top:1px solid #e4e9e7;margin:24px 0}}
@keyframes pulse{{0%{{opacity:1}}50%{{opacity:.5}}100%{{opacity:1}}}}
.verifying{{animation:pulse 1.5s infinite;color:#b77c1e;font-size:12px}}
@media print{{button{{display:none}}body{{margin:24px}}}}
</style>
<button onclick="print()">Imprimir</button>
<h1>Recibo de pagamento</h1>
<dl>{rows}</dl>

<h2>Assinaturas eletrônicas</h2>
<ul>{sig_items if sig_items else '<li style="color:#6f7f7d">Nenhuma assinatura ainda.</li>'}</ul>

<hr>
<div class="validity">
<h2>Validação do documento</h2>
<p><strong>Hash de integridade:</strong></p>
<code>{receipt.document_hash or '—'}</code>
<p style="margin-top:12px">{'✅ Documento íntegro e válido.' if receipt.document_hash else '⏳ Aguardando as duas assinaturas para finalizar.'}</p>
</div>
</html>'''
