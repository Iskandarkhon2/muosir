import { handleRequest } from '../src/serverless/handler.mjs';

export default {
  async fetch(request) {
    return handleRequest(request);
  }
};
