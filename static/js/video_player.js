define([
    'jquery',
    'youtube_player_api'
],
function($) {
    // Video player
    var player = null;
    if (YT)
    {
        return {
            cue_video: function(in_video_id, in_state_changed_listenter) {
                if (!player) {
                    player = new YT.Player('player', {
                        videoId: in_video_id,
                        events: {
                            'onReady': function() { if (player) { player.cueVideo(); } }
                        }
                    });
                    player.addEventListener('onStateChange', in_state_changed_listenter);
                }
                else {
                    player.cueVideoById(in_video_id);
                }
            },
            load_video: function(in_video_id) {
                if (player) {
                    var current_state = player.getPlayerState();
                    if (current_state !== 5) {
                        player.loadVideoById(in_video_id);
                    }
                    player.playVideo();
                }
            },
            play_pause_video: function() {
                if (player) {
                    var current_state = player.getPlayerState();
                    if (current_state === -1 || current_state === 2 || current_state === 5) {
                        player.playVideo();
                    }
                    if (current_state === 1) {
                        player.pauseVideo();
                    }
                }
                else {
                    return false;
                }
            },
            toggle_mute: function() {
                if (player) {
                    if (player.isMuted()) {
                        player.unMute();
                        return false;
                    }
                    else {
                        player.mute();
                        return true;
                    }
                }
            }
        };
    }
    else {
        return null;
    }
});
