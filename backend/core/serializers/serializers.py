from rest_framework import serializers
from ..models import User, Installment, Loan, Payment, Receipt, Notification

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'full_name', 'email', 'phone', 'photo']

class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=160)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Já existe uma conta com este e-mail.')
        return value

class InstallmentSerializer(serializers.ModelSerializer):
    payment_id = serializers.SerializerMethodField()
    payment_confirmed = serializers.SerializerMethodField()

    class Meta:
        model = Installment
        fields = '__all__'
        read_only_fields = ['loan', 'status']

    def get_payment_id(self, obj):
        try:
            return obj.payment.pk
        except Exception:
            return None

    def get_payment_confirmed(self, obj):
        try:
            return obj.payment.confirmed
        except Exception:
            return None

class LoanSerializer(serializers.ModelSerializer):
    installment_list = InstallmentSerializer(many=True, read_only=True)
    creditor_name = serializers.CharField(source='creditor.full_name', read_only=True)
    debtor_name = serializers.CharField(source='debtor.full_name', read_only=True)
    class Meta:
        model = Loan
        fields = '__all__'
        read_only_fields = ['creditor', 'status']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['recorded_by', 'installment', 'confirmed']

class ReceiptSerializer(serializers.ModelSerializer):
    loan_name = serializers.CharField(source='payment.installment.loan.name', read_only=True)
    installment_number = serializers.IntegerField(source='payment.installment.number', read_only=True)
    installment_total = serializers.IntegerField(source='payment.installment.loan.installments', read_only=True)
    amount = serializers.DecimalField(source='payment.amount', max_digits=12, decimal_places=2, read_only=True)
    payment_date = serializers.DateField(source='payment.payment_date', read_only=True)
    payment_method = serializers.CharField(source='payment.payment_method', read_only=True)

    class Meta:
        model = Receipt
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['user', 'created_at']
