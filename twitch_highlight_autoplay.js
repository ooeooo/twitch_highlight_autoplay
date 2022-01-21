// ==UserScript==
// @name         Twitch Highlight AutoPlay
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.twitch.tv/videos/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
	console.log('Twitch Highlight AutoPlay Runing...');
})();

window.onload = function () {

	var req = new XMLHttpRequest();
	function get_comments(vid, oauth, cursor = 1) {
		let url = 'https://api.twitch.tv/v5/videos/' + vid.toString() + '/comments?';
		if (cursor === 1) {
			url = url + 'content_offset_seconds=0';
		} else {
			url = url + 'cursor=' + cursor;
		}
		req.open('GET', url, false);
		req.setRequestHeader('authorization', oauth);
		req.send();
		return JSON.parse(req.response);
	}

	var highlight = {};

	function get_all_comments() {
		let vid = window.location.pathname.substring(8);
		let oauth = window.authorization;
		let cursor = 1;
		while (cursor) {
			let r = get_comments(vid, oauth, cursor);
			highlight_update(r.comments);
			cursor = r._next;
			console.log(cursor);
		}

	}

	function highlight_update(comments) {
		comments.forEach(one => {
			let i = parseInt(one.content_offset_seconds / 60);
			highlight[i] = (highlight[i] || 0) + 1;
		});
	}

	function highlight_time(rate) {
		var res = Object.keys(highlight).sort(function (a, b) { return highlight[a] - highlight[b]; });
		res = res.slice(-parseInt(rate * res.length));
		res = res.sort();
		console.log(res);
		return res;
	}

	get_all_comments();


	function sleep(time) {
		return new Promise((resolve) => setTimeout(resolve, time));
	}
	// 播放highlight之前1分钟和当前1分钟
	async function autoplay_highlight(highlight, step = 1) {
		let vd = document.querySelector('video');
		let flag = !1;
		while (1) {
			await sleep(1000);
			let tm = parseInt(vd.currentTime / 60);
			for (var i = 0; i < highlight.length; i++) {
				let th = parseInt(highlight[i]);
				if (th >= tm) {
					if (th - tm > step) {
						vd.currentTime = (th - step) * 60;
						console.log(vd.currentTime / 60);
					}
					break;
				}
			}
			if (tm > highlight.slice(-1) && !flag) {
				flag = !0;
				await sleep(5000);
				vd.pause();

			}
		}
	}

	autoplay_highlight(highlight_time(0.05));
};