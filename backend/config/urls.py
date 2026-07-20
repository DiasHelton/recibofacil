from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from core.views.spa import spa_index
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': settings.FRONTEND_DIST / 'assets'}),
    re_path(r'^.*$', spa_index),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
