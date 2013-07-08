# coding=utf-8
# -----------------------------------------------------------------------------


from os import pardir, path


# -----------------------------------------------------------------------------


CONFIG_ROOT = path.dirname(path.abspath(__file__))
PROJECT_ROOT = path.join(path.dirname(path.abspath(__file__)), pardir)


# -----------------------------------------------------------------------------


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': 'youqueue',
    }
}

STATIC_ROOT = ''
STATIC_URL = '/static/'


# -----------------------------------------------------------------------------
