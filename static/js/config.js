var require = {
    paths: {
        'jquery': [
            '//ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min',
            'libs/jquery-1.10.1.min'
        ],
        'backbone': 'libs/backbone.min',
        'underscore': 'libs/underscore.min',
        'handlebars': 'libs/handlebars',
        'backbone_local_storage': 'libs/backbone.localStorage',
        'bootstrap': 'libs/bootstrap.min',
        'jquery_ui': 'libs/jquery-ui-1.10.3.custom.min',
        'jquery_typing': 'libs/jquery.typing-0.2.0.min',
        'youtube_player_api': 'https://www.youtube.com/iframe_api?ext=',
        'video_player': 'video_player'
    },
    shim: {
        'underscore': {
            exports: '_'
        },
        'backbone': {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        'handlebars':
        {
            exports: 'Handlebars'
        },
        'backbone_local_storage': ['backbone'],
        'bootstrap': ['jquery'],
        'jquery_ui': ['jquery'],
        'jquery_typing': ['jquery'],
        'video_player': ['jquery', 'youtube_player_api']
    }
};
