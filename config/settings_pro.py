# coding=utf-8
# -----------------------------------------------------------------------------


from os import pardir, path
from dj_database_url import config


# -----------------------------------------------------------------------------


CONFIG_ROOT = path.dirname(path.abspath(__file__))
PROJECT_ROOT = path.join(path.dirname(path.abspath(__file__)), pardir)


# -----------------------------------------------------------------------------


DATABASES = {'default': config()}

STATIC_ROOT = '%s/collectstatic' % PROJECT_ROOT
STATIC_URL = '/static/'


# -----------------------------------------------------------------------------
