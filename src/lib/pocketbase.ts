import PocketBase from 'pocketbase';

export const pb = new PocketBase(window.location.protocol + "//" + window.location.hostname + ":8090");
