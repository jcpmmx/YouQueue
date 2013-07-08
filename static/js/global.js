require([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'video_player',
    'bootstrap',
    'jquery_ui',
    'backbone_local_storage',
    'jquery_typing'
],
function($, _, Backbone, Handlebars, VP) {
    $(function() {
        // Extending jQuery
        $.ajaxSetup({
            beforeSend: function() {
                $('#div_search_loading').show();
            },
            complete: function(){
                $('#div_search_loading').hide();
            },
            success: function() {}
        });
        // Handlebars template helpers
        Handlebars.registerHelper('truncate', function(in_length, in_string) {
            in_length = parseInt(in_length);
            var new_string = in_string.length > in_length ? in_string.substr(0, in_length) + '...' : in_string;
            return new Handlebars.SafeString(new_string);
        });
        // Backbone models
        var Video = Backbone.Model.extend({
            defaults: function() {
                return {
                    youtube_id: 'videoId',
                    title: 'YouTube video',
                    description: 'Video description',
                    thumbnail: 'http://placehold.it/30x30',
                    order: queueVideos.next_order(),
                    selected: false,
                    playing_now: false
                };
            },
            get_ytid: function() {
                return this.get('youtube_id');
            },
            set_as_playing: function() {
                this.set('playing_now', true);
            },
            set_as_paused: function() {
                this.set('playing_now', false);
            }
        });
        // Backbone collections
        var SearchResultsVideos = Backbone.Collection.extend({
            model: Video,
            localStorage: new Backbone.LocalStorage('youqueue_search_results'),
            query: '',
            next_page_token: null,
            initialize: function() {
                this.on('need_more_videos', this.retrieve_more_videos);
            },
            search_videos: function(in_query) {
                var that = this;
                that.query = in_query;
                $.get('/search/', { q: that.query }, function(in_rsp) {
                    that.next_page_token = in_rsp.next_page_token;
                    that.load_results(in_rsp.videos_found);
                });
            },
            load_results: function(in_found_videos) {
                var that = this;
                $.each(in_found_videos, function(in_idx, in_video) {
                    that.create({
                        youtube_id: in_video.id,
                        title: in_video.title,
                        description: in_video.description,
                        thumbnail: in_video.thumbnail
                    });
                });
            },
            search_more_videos: function(in_limit) {
                var that = this;
                $.get('/search/', { q: that.query, npt: that.next_page_token, l: in_limit }, function(in_rsp) {
                    that.next_page_token = in_rsp.next_page_token;
                    that.load_results(in_rsp.videos_found);
                });
            },
            retrieve_more_videos: function() {
                var that = this,
                    need_more_videos = 5 - this.length;
                setTimeout(that.search_more_videos(need_more_videos), 1000);
            }
        });
        var QueueVideos = Backbone.Collection.extend({
            model: Video,
            localStorage: new Backbone.LocalStorage('youqueue_queue'),
            comparator: 'order',
            currently_playing_index: 1,
            previous_size: 0,
            initialize: function() {
                this.listenTo(this, 'add', this.decrease_previous_size);
                this.listenTo(this, 'select_none', this.select_none);
            },
            increase_previous_size: function() {
                this.previous_size = this.length + 1;
            },
            decrease_previous_size: function() {
                this.previous_size = this.length - 1;
            },
            next_order: function() {
                if (!this.length) {
                    return 1;
                }
                return this.last().get('order') + 1;
            },
            select_none: function() {
                this.each(function(video) {
                    video.set('selected', false);
                }, this);
            },
            get_playing_video: function() {
                var video = this.findWhere({ selected: true });
                return {
                    $el: $('#' + video.get_ytid()),
                    video: video
                };
            },
            select_video: function(in_video) {
                this.select_none();
                in_video.set({ selected: true });
                this.currently_playing_index = in_video.get('order');
                return in_video;
            },
            set_previous_video: function() {
                var current_order = this.currently_playing_index,
                    target_order = current_order === 1 ? this.length : current_order - 1,
                    video = this.findWhere({ order: target_order });
                return this.select_video(video);
            },
            set_next_video: function() {
                var current_order = this.currently_playing_index,
                    target_order = current_order === this.length ? 1 : current_order + 1,
                    video = this.findWhere({ order: target_order });
                return this.select_video(video);
            },
            shuffle: function() {
                this.reset(this.shuffle());
            }
        });
        var searchResultsVideos = new SearchResultsVideos();
        var queueVideos = new QueueVideos();
        // Backbone views
        var SearchResultVideo = Backbone.View.extend({
            tagName: 'li',
            template: Handlebars.compile($('#template_search_result_video').html()),
            events: {
                'mouseover': 'show_icon',
                'mouseout': 'hide_icon',
                'click': 'move_to_queue'
            },
            initialize: function() {
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.model, 'remove', this.remove);
            },
            render: function() {
                this.$el.html(this.template(this.model.toJSON()));
                this.$el.attr('title', 'Add it to your queue');
                return this;
            },
            show_icon: function(e) {
                this.$el.find('i').show();
            },
            hide_icon: function(e) {
                this.$el.find('i').hide();
            },
            move_to_queue: function(e) {
                var $video_in_queue = $('#' + this.model.get_ytid());
                if ($video_in_queue.length > 0) {
                    $video_in_queue.fadeTo('normal', 0.3).fadeTo('normal', 1.0);
                }
                else {
                    this.model.set('order', queueVideos.next_order());
                    queueVideos.add(this.model);
                }
                searchResultsVideos.remove(this.model);
                if (searchResultsVideos.length === 0) {
                    searchResultsVideos.trigger('need_more_videos');
                }
            }
        });
        var QueueVideo = Backbone.View.extend({
            tagName: 'li',
            template: Handlebars.compile($('#template_queue_video').html()),
            events: {
                'click': 'play_video',
                'click .span_delete': 'delete_from_queue'
            },
            initialize: function() {
                this.listenTo(this.model, 'change', this.render);
            },
            render: function() {
                this.$el.html(this.template(this.model.toJSON()));
                this.$el.attr('id', this.model.get_ytid());
                this.$el.attr('title', 'Play this video, or hold to drag');
                if (this.model.get('selected')) {
                    this.$el.addClass('li_selected_video');
                }
                else {
                    this.$el.removeClass('li_selected_video');
                }
                return this;
            },
            play_video: function(e) {
                queueVideos.trigger('select_none');
                this.model.set('selected', true);
                queueVideos.currently_playing_index = this.model.get('order');
                this.trigger('play_video', { video: this.model });
            },
            delete_from_queue: function(e) {
                e.stopPropagation();
                queueVideos.remove(this.model);
                queueVideos.increase_previous_size();
                queueVideos.trigger('reorder_videos');
            }
        });
        var SearchResultsView = Backbone.View.extend({
            el: $('#ul_search_results'),
            initialize: function() {
                this.listenTo(searchResultsVideos, 'add', this.add_video);
            },
            add_video: function(video) {
                var view = new SearchResultVideo({ model: video });
                this.$el.append(view.render().el);
            }
        });
        var QueueView = Backbone.View.extend({
            el: $('#ul_queue'),
            initialize: function() {
                this.on('reorder_videos', this.reorder_videos);
                this.listenTo(queueVideos, 'add remove', this.render);
                this.listenTo(queueVideos, 'remove', this.reorder_videos);
            },
            render: function() {
                var that = this;
                this.$el.html('');
                queueVideos.each(function(video) {
                    var view = new QueueVideo({ model: video });
                    that.listenTo(view, 'play_video', that.play_video);
                    that.$el.append(view.render().el);
                }, this);
                this.check_queue_size();
            },
            check_queue_size: function() {
                if (queueVideos.length === 0) {
                    playerControlsView.hide_controls();
                    $('#p_queue_status').text('Your queue is empty.');
                    $('#ul_queue').hide();
                }
                else {
                    var queue_status = queueVideos.length + ' videos in your queue.';
                    playerControlsView.show_controls();
                    if (queueVideos.length === 1) {
                        var first_video = queueVideos.at(0);
                        queue_status = '1 video in your queue.';
                        if (queueVideos.previous_size === 0) {
                            VP.cue_video(first_video.get_ytid(), function(e) {
                                playerControlsView.trigger('player_changed', { current_video: e.target.getVideoData().video_id, new_state: e.data });
                            });
                        }
                    }
                    $('#p_queue_status').text(queue_status);
                    $('#ul_queue').show();
                }
            },
            play_video: function(e) {
                VP.load_video(e.video.get_ytid());
            },
            set_currently_playing_pause: function(e) {
                VP.load_video(e.video.get_ytid());
            },
            reorder_videos: function() {
                var new_order = 1;
                $.each(this.$el.find('li'), function(idx, el) {
                    queueVideos.findWhere({ youtube_id: $(el).attr('id') }).set('order', new_order);
                    new_order++;
                });
            }
        });
        var PlayerControlsView = Backbone.View.extend({
            el: $('#div_player_controls'),
            events: {
                'click #btn_play_pause': 'play_pause',
                'click #btn_previous': 'go_previous',
                'click #btn_next': 'go_next',
                'click #btn_shuffle': 'shuffle',
                'click #btn_mute': 'toggle_mute'
            },
            initialize: function() {
                this.on('player_changed', this.player_changed);
            },
            show_controls: function() {
                this.$el.show();
            },
            hide_controls: function() {
                this.$el.hide();
            },
            player_changed: function(e){
                var video_id = e.current_video,
                    video = queueVideos.findWhere({ youtube_id: video_id }),
                    new_state = e.new_state,
                    $btn_play_pause = $('#btn_play_pause'),
                    $btn_play_pause_icon = $btn_play_pause.find('i');
                queueVideos.select_video(video);
                if (new_state === 1) {
                    $btn_play_pause_icon.attr('class', 'icon-pause');
                    video.set_as_playing();
                }
                else if (new_state === 0) {
                    this.go_next();
                }
                else {
                    $btn_play_pause_icon.attr('class', 'icon-play');
                    video.set_as_paused();
                }
            },
            play_pause: function(e) {
                VP.play_pause_video();
            },
            go_previous: function() {
                var video = queueVideos.set_previous_video();
                queueView.play_video({ video: video });
            },
            go_next: function() {
                var video = queueVideos.set_next_video();
                queueView.play_video({ video: video });
            },
            toggle_mute: function(e) {
                var $el = $(e.currentTarget);
                if (VP.toggle_mute()) {
                    $el.addClass('active');
                }
                else {
                    $el.removeClass('active');
                }
            }
        });
        var searchResultsView = new SearchResultsView();
        var queueView = new QueueView();
        var playerControlsView = new PlayerControlsView();
        // Init
        $('#ul_queue').sortable({
            placeholder: 'li_droppable_video',
            stop: function() { queueView.trigger('reorder_videos'); }
        }).disableSelection();
        var search_in_youtube = function(in_query) {
            searchResultsVideos.remove(searchResultsVideos.models);
            searchResultsVideos.search_videos(in_query);
        };
        $('#input_search').typing({
            stop: function (e, $el) {
                var query = $el.val();
                search_in_youtube(query);
            },
            delay: 400
        }).focus();
    });
});
