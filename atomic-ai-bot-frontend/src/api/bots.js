import { apiRequest } from './index';

export function listBots() {
  return apiRequest('/app/bots');
}

export function createBot(data) {
  return apiRequest('/app/bots', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateBot(bot_id, data) {
  return apiRequest(`/app/bots/${bot_id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteBot(bot_id) {
  return apiRequest(`/app/bots/${bot_id}`, {
    method: 'DELETE',
  });
}

export function validateWidget(api_key) {
  return apiRequest(`/app/public/validate/${api_key}`);
}
