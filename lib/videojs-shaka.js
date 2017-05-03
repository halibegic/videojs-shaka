/**
 * videojs.shaka.js
 *
 * Use of this source code is governed by a license that can be
 * found in the LICENSE file.
 *
 * @copyright 2016 halibegic
 * @author halibegic <hasan461@gmail.com>
 */
(function(window, videojs, shaka, document, undefined) {
    'use strict';

    /**
     * Initialize the plugin.
     * @param options (optional) {object} configuration for the plugin
     */
    var Component = videojs.getComponent('Component');
    var Tech = videojs.getTech('Tech');
    var Html5 = videojs.getComponent('Html5');

    var ShakaTech = videojs.extend(Html5, {

        createEl: function() {
            var me = this;

            this.el_ = Html5.prototype.createEl.apply(this, arguments);

            // Install built-in polyfills to patch browser incompatibilities.
            shaka.polyfill.installAll();

            this.shaka_ = new shaka.Player(this.el_);

            this.shaka_.configure({
                abr: {
                    enabled: true
                },
                drm: this.options_.drm || {}
            });

            this.shaka_.addEventListener('buffering', function(e) {
                if (e.buffering) me.trigger('waiting');
            });

            this.el_.tech = this;
            return this.el_;
        },

        setSrc: function(src) {

            var me = this;

            this.shaka_.load(src).then(function() {
                me._initQuality()
            });
        },

        dispose: function() {

            this.shaka_.unload();
            this.shaka_.destroy();

            return Html5.prototype.dispose.apply(this);
        },

        _initQuality: function() {

            var me = this;

            this.player_.trigger('loadedqualitydata', {
                qualityData: {
                    video: me._getQuality()
                },
                qualitySwitchCallback: function(id, type) {

                    // Update the adaptation.
                    me.shaka_.configure({
                        abr: {
                            enabled: id === -1
                        }
                    });

                    // Is auto?
                    if (id === -1) return;

                    var tracks = me.shaka_.getTracks().filter(function(t) {
                        return t.id === id && t.type === type
                    });

                    me.shaka_.selectTrack(tracks[0], /* clearBuffer */ true);
                }
            });
        },

        _getQuality: function() {

            var tracks = [],
                levels = this.shaka_.getTracks().filter(function(t) {
                    return t.type === 'video'
                });

            if (levels.length > 1) {

                var autoLevel = {
                    id: -1,
                    label: 'auto',
                    selected: true
                };

                tracks.push(autoLevel);
            }

            levels.forEach(function(level, index) {

                var track = level;

                track.label = level.height + 'p (' + ((level.bandwidth / 1000).toFixed(0)) + 'k)';

                tracks.push(track);
            });

            return tracks;
        }
    });

    ShakaTech.isSupported = function() {
        return !!window.MediaSource;
    };

    ShakaTech.canPlaySource = function(source, tech) {

        var dashTypeRE = /^application\/dash\+xml/i;

        if (dashTypeRE.test(source.type)) {
            return 'probably';
        }

        return '';
    };

    // Register as Component and Tech;
    Component.registerComponent('Shaka', ShakaTech);
    Tech.registerTech('Shaka', ShakaTech);

    videojs.options.techOrder.push('Shaka');
})
(window, videojs, shaka, document);
