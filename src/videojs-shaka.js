/**
 * videojs-shaka.js
 *
 * License can be found in the LICENSE file.
 *
 * @copyright 2016 halibegic
 * @author halibegic <hasan461@gmail.com>
 */

const Html5 = videojs.getComponent('Html5');

class ShakaTech extends Html5 {

    constructor(options, ready) {

        let source = options.source;
        delete options.source;

        super(options, ready);

        shaka.polyfill.installAll();

        let video = this.el();

        this.shakaPlayer = new shaka.Player(video);

        this.shakaPlayer.addEventListener('error', (e) => {
            videojs(this.options_.playerId).trigger('error', e);
        });

        this.shakaPlayer.load(source.src);
    }

    static isSupported() {
        return !!window.MediaSource;
    }

    static canPlaySource(srcObj) {
        return (srcObj.type === 'application/dash+xml') ? 'maybe' : '';
    }
}

videojs.registerTech('Shaka', ShakaTech);
videojs.options.techOrder.unshift('Shaka');
