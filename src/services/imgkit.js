import ImageKit from 'imagekit-javascript';

const imagekit = new ImageKit({
  publicKey: process.env.REACT_APP_IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: process.env.REACT_APP_IMAGEKIT_URL_ENDPOINT,
  privateKey: process.env.REACT_APP_IMAGEKIT_PRIVATE_KEY, // Optional, if server-side auth is used  
});

export default imagekit;