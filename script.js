let totalMessages = 0,
  messagesLimit = 0,
  nickColor = "user",
  removeSelector,
  addition,
  customNickColor,
  channelName,
  provider;
let animationIn = "bounceIn";
let animationOut = "bounceOut";
let hideAfter = 60;
let hideCommands = "no";
let ignoredUsers = [];
let previousSender = "";
let mergeMessages = false;

window.addEventListener("onEventReceived", function (obj) {
  if (obj.detail.event.listener === "widget-button") {
    if (obj.detail.event.field === "testMessage") {
      let emulated = new CustomEvent("onEventReceived", {
        detail: {
          listener: "message",
          event: {
            service: "twitch",
            data: {
              time: Date.now(),
              tags: { "display-name": "TestUser", color: "#FF0000" },
              nick: "TestUser",
              userId: "12345",
              displayName: "TestUser",
              displayColor: "#FF0000",
              badges: [],
              channel: channelName,
              text: "Hello world! Kappa",
              emotes: [
                {
                  type: "twitch",
                  name: "Kappa",
                  id: "25",
                  gif: false,
                  urls: {
                    1: "https://static-cdn.jtvnw.net/emoticons/v1/25/1.0",
                    2: "https://static-cdn.jtvnw.net/emoticons/v1/25/2.0",
                    4: "https://static-cdn.jtvnw.net/emoticons/v1/25/3.0",
                  },
                  start: 12,
                  end: 17,
                },
              ],
              msgId: "test-msg-12345",
            },
            renderedText:
              'Hello world! <img src="https://static-cdn.jtvnw.net/emoticons/v1/25/1.0" class="emote">',
          },
        },
      });
      window.dispatchEvent(emulated);
    }
    return;
  }

  if (obj.detail.listener !== "message") return;
  let data = obj.detail.event.data;
  if (data.text.startsWith("!") && hideCommands === "yes") return;
  if (ignoredUsers.includes(data.nick)) return;

  let message = attachEmotes(data);
  let badges = data.badges
    .map(
      (badge) =>
        `<img alt="" src="${badge.url}" class="badge ${badge.type}-icon"> `
    )
    .join("");
  let username = `<span style="color:${data.displayColor || "#FFFFFF"}">${
    data.displayName
  }:</span>`;

  addMessage(username, badges, message, data.isAction, data.userId, data.msgId);
  previousSender = data.userId;
});

window.addEventListener("onWidgetLoad", function (obj) {
  const fieldData = obj.detail.fieldData;
  animationIn = fieldData.animationIn;
  animationOut = fieldData.animationOut;
  hideAfter = fieldData.hideAfter;
  messagesLimit = fieldData.messagesLimit;
  nickColor = fieldData.nickColor;
  customNickColor = fieldData.customNickColor;
  hideCommands = fieldData.hideCommands;
  channelName = obj.detail.channel.username;
  mergeMessages = fieldData.mergeMessages === "yes";

  fetch(
    `https://api.streamelements.com/kappa/v2/channels/${obj.detail.channel.id}/`
  )
    .then((response) => response.json())
    .then((profile) => {
      provider = profile.provider;
    });
});

function attachEmotes(message) {
  let text = html_encode(message.text);
  let isSingleEmote =
    message.emotes.length === 1 && text.trim() === message.emotes[0].name;

  message.emotes.forEach((emote) => {
    let emoteSizeClass = isSingleEmote ? "emote-large" : "emote-normal";
    let emoteImg = `<img src="${emote.urls[4]}" class="emote ${emoteSizeClass}">`;

    console.log("Emote HTML:", emoteImg);

    let regex = new RegExp(
      `${emote.name.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, "\\$&")}`,
      "g"
    );
    text = text.replace(regex, emoteImg);
  });

  return text;
}

function html_encode(e) {
  return e.replace(/[<>"^]/g, function (e) {
    return "&#" + e.charCodeAt(0) + ";";
  });
}

function addMessage(username, badges, message, isAction, uid, msgId) {
  totalMessages += 1;
  let actionClass = isAction ? "action" : "";

  const element = $.parseHTML(`
    <div data-sender="${uid}" data-msgid="${msgId}" class="message-row ${animationIn} animated" id="msg-${totalMessages}">
        <div class="user-box ${actionClass}">${badges}${username}</div>
        <div class="user-message ${actionClass}">${message}</div>
    </div>`);

  $(element).appendTo(".main-container");
  if (hideAfter !== 999) {
    $(element)
      .delay(hideAfter * 1000)
      .queue(function () {
        $(this)
          .removeClass(animationIn)
          .addClass(animationOut)
          .delay(1000)
          .queue(function () {
            $(this).remove();
          });
      });
  }

  if (totalMessages > messagesLimit) {
    $(".message-row").first().remove();
  }
}
