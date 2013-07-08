# coding=utf-8
# -----------------------------------------------------------------------------


from simplejson import dumps
from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render
from .utils import search_in_youtube


# -----------------------------------------------------------------------------


def index(in_request):
    """
    View that handles the index page of the project.
    """
    # Returning
    return render(in_request, 'global.html', {})


def search(in_request):
    """
    AJAX view that searches videos using YouTube API given a query string, and
    returns the first 10 videos found.
    """
    # Only AJAX calls with params are accepted
    if in_request.is_ajax():
        query = in_request.GET.get('q', None)
        next_page_token = in_request.GET.get('npt', None)
        limit = in_request.GET.get('l', 5)
        if query:
            # Searching in YouTube
            videos_found, next_page_token = search_in_youtube(
                query, next_page_token=next_page_token, limit=limit
            )
            json_response = dumps(
                {
                    'videos_found': videos_found,
                    'next_page_token': next_page_token
                },
                namedtuple_as_object=True
            )
            # Returning
            return HttpResponse(json_response, content_type='application/json')
    # Returning
    return HttpResponseBadRequest('Only AJAX calls with params are accepted.')


# -----------------------------------------------------------------------------
