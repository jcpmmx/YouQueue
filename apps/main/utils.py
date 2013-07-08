# coding=utf-8
# -----------------------------------------------------------------------------


from collections import namedtuple
from django.conf import settings
from apiclient.discovery import build


# -----------------------------------------------------------------------------


YuoTubeVideo = namedtuple(
    'YuoTubeVideo', (
        'id', 'title', 'description', 'thumbnail',
    )
)


# -----------------------------------------------------------------------------


def custom_context_values(request):
    """
    Method that adds custom variables to all templates.
    """
    return {
        'TRUE': True,
        'False': False,
        'BASE_URL': request.get_host(),
    }


# -----------------------------------------------------------------------------


def search_in_youtube(in_query, next_page_token=None, limit=5):
    """
    Method that calls YouTube Data API to search videos given a query string.
    """
    # Creating YouTube Data API service
    youtube = build('youtube', 'v3', developerKey=settings.GOOGLE_API_KEY)
    # Searching
    search_response = youtube.search().list(
        q=in_query, part='id,snippet', maxResults=limit,
        type='video', pageToken=next_page_token
    ).execute()
    # Analyzing the results
    found_videos = []
    for search_result in search_response.get('items', []):
        if search_result['id']['kind'] == 'youtube#video':
            found_videos.append(
                YuoTubeVideo(
                    search_result['id']['videoId'],
                    search_result['snippet']['title'],
                    search_result['snippet']['description'],
                    search_result['snippet']['thumbnails']['default']['url']
                )
            )
    next_page_token = search_response.get('nextPageToken', None)
    # Returning
    return found_videos, next_page_token


# -----------------------------------------------------------------------------
