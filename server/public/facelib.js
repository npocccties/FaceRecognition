let stream;
let streamSettings;
let track;
let ic;

export async function init() {
  try {
    const constraints = {
      audio: false,
      video: true
    };
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    track = stream.getVideoTracks()[0];
    streamSettings = track.getSettings();
    console.log(streamSettings);
    ic = new ImageCapture(track);
    return stream;
　} catch(err) {
    console.log('init error');
    throw err;
　}
};

export async function capture() {
  try {
    const blob = await ic.takePhoto();
    return {
      blob,
      params: {
        type: blob.type,
        width: streamSettings.width,
        height: streamSettings.height,
      },
    };
  } catch(err) {
    console.log('capture error');
    throw err;
  }
};

export async function drawImage(blob, canvas, grayscale = false){
  const bitmap = await createImageBitmap(blob);
  const ctx = canvas.getContext("2d");
  if (grayscale) {
    ctx.filter = 'grayscale(1)';
  } else {
    ctx.filter = 'none';
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
};

export async function compress(oblob, option) {
  const {canvas, width, height} = option;
  canvas.width = width;
  canvas.height = height;
  await drawImage(oblob, canvas, option.grayscale);
  const blob = await new Promise(resolve => {
    canvas.toBlob(b => {
      resolve(b);
    }, option.type, option.quality);
  });
  return {
    blob,
    params: {
      type: blob.type,
      width: canvas.width,
      height: canvas.height,
    },
  }
};

async function blob2base64(blob) {
  const ab = await blob.arrayBuffer();
  const uia = new Uint8Array(ab);
  const str = uia.reduce((data, byte) => {
    return data + String.fromCharCode(byte);
  }, '')
  return window.btoa(str);
}

async function postWithImageJSON(url, params, image) {
  params.image = await blob2base64(image);
  return await axios.post(url, params);
}

async function postWithImageMulti(url, params, image) {
  const form = new FormData();
  form.append('params', JSON.stringify(params));
  form.append('image', image);
  return await axios.post(url, form);
}

export const postWithImage = postWithImageJSON;
