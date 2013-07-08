# coding=utf-8
# -----------------------------------------------------------------------------


from django.conf import settings
from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns


# -----------------------------------------------------------------------------


admin.autodiscover()


# -----------------------------------------------------------------------------


urlpatterns = patterns(
    '',
    url(r'^$', 'apps.main.views.index', name='index'),
    url(r'^search/$', 'apps.main.views.search', name='search'),
)


if settings.ENVIRONMENT == 'PRO':
    urlpatterns += staticfiles_urlpatterns()


# -----------------------------------------------------------------------------
