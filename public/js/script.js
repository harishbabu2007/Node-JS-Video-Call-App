const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const message_container = document.getElementById("msg_container");
const participant_container = document.getElementById("participant_container");
const join_audio = new Audio("/media/join.wav");

var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

const myPeer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3000",
});

// server port 443

const myVideo = document.createElement("video");
myVideo.muted = true;

let MyVideoStream;

const peers = {};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    MyVideoStream = stream;
    addVideoStream(myVideo, MyVideoStream, false);

    myPeer.on("call", (call) => {
      call.answer(MyVideoStream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream, true);
      });
      call.on("close", () => {
        video.remove();
      });

      peers[call.peer] = call;
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, MyVideoStream);
    });
  });

myPeer.on("call", function (call) {
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      call.answer(MyVideoStream); // Answer the call with an A/V stream.
      const video = document.createElement("video");
      call.on("stream", function (remoteStream) {
        addVideoStream(video, remoteStream, true);
      });
      call.on("close", () => {
        video.remove();
      });
      peers[call.peer] = call;
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

socket.on("user-disconnected", (userId, roomId) => {
  if (peers[userId]) {
    peers[userId].close();
    join_audio.play();
  }
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id, USER_NAME, PIC);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream, true);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream, other) {
  if (other) join_audio.play();
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

let text = $("input");

$("html").keydown((e) => {
  if (e.which == 13 && text.val().length !== 0) {
    socket.emit("message", text.val(), ROOM_ID);
    text.val("");
  }
});

socket.on("createMessage", (msg) => {
  createMessage(msg);
});

const createMessage = (msg) => {
  const new_message = document.createElement("p");
  new_message.innerText = msg;
  new_message.style.color = "#f5f5f5";
  new_message.style.padding = 20;
  new_message.style.marginTop = "10px";
  message_container.append(new_message);
};

const MuteUnmute = () => {
  const enabled = MyVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    MyVideoStream.getAudioTracks()[0].enabled = false;
    setMuteButton();
  } else {
    setUnmuteButton();
    MyVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setUnmuteButton = () => {
  const btn = document.getElementById("mute_unmute_btn");
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `;
  btn.innerHTML = html;
};

const setMuteButton = () => {
  const btn = document.getElementById("mute_unmute_btn");
  const html = `
    <i class="mute fas fa-microphone-slash"></i>
    <span class='mute'>Unmute</span>
  `;
  btn.innerHTML = html;
};

const StartStopVideo = () => {
  const enabled = MyVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    MyVideoStream.getVideoTracks()[0].enabled = false;
    setStopVidButton();
  } else {
    setStartVidButton();
    MyVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setStopVidButton = () => {
  const startStopVideoEle = document.getElementById("start_stop_vid");
  html = `
    <i class="mute fas fa-video-slash"></i>
    <span class='mute'>Start Video</span>
  `;
  startStopVideoEle.innerHTML = html;
};

const setStartVidButton = () => {
  const startStopVideoEle = document.getElementById("start_stop_vid");
  html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `;
  startStopVideoEle.innerHTML = html;
};

const openNav = () => {
  document.getElementById("main__right_id_participants").style.flex = "0";
  document.getElementById("main__right_id").style.flex = "0.2";
  document.getElementById("main__left_id").style.flex = "0.8";
};

const closeNav = () => {
  document.getElementById("main__right_id").style.flex = "0";
  document.getElementById("main__right_id_participants").style.flex = "0";
  document.getElementById("main__left_id").style.flex = "1";
};

const LeaveMeeting = () => {
  window.location = "/meetings/thanks";
};

const openPart = () => {
  document.getElementById("main__right_id").style.flex = "0";
  document.getElementById("main__left_id").style.flex = "0.8";
  document.getElementById("main__right_id_participants").style.flex = "0.2";
};

const closePart = () => {
  document.getElementById("main__right_id").style.flex = "0";
  document.getElementById("main__left_id").style.flex = "1";
  document.getElementById("main__right_id_participants").style.flex = "0";
};

socket.on("get-users", async (roomId) => {
  await fetch(`/data/participants/${roomId}`).then((res) =>
    res.json().then((data) => {
      const parent_div = document.createElement("div");

      data.map((item) => {
        const div_ele = document.createElement("div");
        div_ele.className = "participant";

        const image = document.createElement("img");
        image.src = item?.profilePicture;
        div_ele.append(image);

        const name = document.createElement("p");
        name.innerText = item?.userName;
        div_ele.append(name);

        parent_div.append(div_ele);
      });
      participant_container.innerHTML = parent_div.innerHTML;
    })
  );
});
