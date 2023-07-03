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
    console.log('Twitch Highlight AutoPlay Running...');

    // 主要逻辑函数
    function runHighlightAutoPlay() {
        const videoId = getVideoId();
        const oauthToken = getOAuthToken();
        const comments = getAllComments(videoId, oauthToken);
        const highlight = updateHighlight(comments);
        const highlightTimes = getHighlightTimes(highlight, 0.05);
        autoplayHighlight(highlightTimes);
    }

    // 获取视频ID
    function getVideoId() {
        return window.location.pathname.substring(8);
    }

    // 获取 OAuth Token
    function getOAuthToken() {
        return window.authorization;
    }

    // 获取所有评论
    function getAllComments(videoId, oauthToken) {
        const comments = [];
        let cursor = 1;
        while (cursor) {
            const response = getComments(videoId, oauthToken, cursor);
            comments.push(...response.comments);
            cursor = response._next;
        }
        return comments;
    }

    // 获取评论
    function getComments(videoId, oauthToken, cursor) {
        const url = 'https://api.twitch.tv/v5/videos/' + videoId + '/comments?' +
            (cursor === 1 ? 'content_offset_seconds=0' : 'cursor=' + cursor);
        const req = new XMLHttpRequest();
        req.open('GET', url, false);
        req.setRequestHeader('authorization', oauthToken);
        req.send();
        return JSON.parse(req.response);
    }

    // 更新热点片段
    function updateHighlight(comments) {
        const highlight = {};
        comments.forEach(comment => {
            const minute = parseInt(comment.content_offset_seconds / 60);
            highlight[minute] = (highlight[minute] || 0) + 1;
        });
        return highlight;
    }

    // 获取热点片段的时间
    function getHighlightTimes(highlight, rate) {
        const sortedMinutes = Object.keys(highlight).sort((a, b) => highlight[a] - highlight[b]);
        const selectedMinutes = sortedMinutes.slice(-parseInt(rate * sortedMinutes.length)).sort();
        console.log(selectedMinutes);
        return selectedMinutes;
    }

    // 自动播放热点片段
    async function autoplayHighlight(highlightTimes, step = 1) {
        const video = document.querySelector('video');
        let flag = false;
        while (true) {
            await sleep(1000);
            const currentTime = parseInt(video.currentTime / 60);
            for (let i = 0; i < highlightTimes.length; i++) {
                const highlightTime = parseInt(highlightTimes[i]);
                if (highlightTime >= currentTime) {
                    if (highlightTime - currentTime > step) {
                        video.currentTime = (highlightTime - step) * 60;
                        console.log(video.currentTime / 60);
                    }
                    break;
                }
            }
            if (currentTime > highlightTimes.slice(-1) && !flag) {
                flag = true;
                await sleep(5000);
                video.pause();
            }
        }
    }

    // 延时函数
    function sleep(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    // 运行主要逻辑
    runHighlightAutoPlay();
})();
