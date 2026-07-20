import os
from django.http import FileResponse, Http404
from django.conf import settings


def spa_index(request):
    path = settings.FRONTEND_DIST / 'index.html'
    if not path.exists():
        raise Http404
    return FileResponse(open(path, 'rb'), content_type='text/html')


def spa_static(request, path):
    filepath = settings.FRONTEND_DIST / path
    if not filepath.exists() or not filepath.is_file():
        raise Http404
    return FileResponse(open(filepath, 'rb'))
