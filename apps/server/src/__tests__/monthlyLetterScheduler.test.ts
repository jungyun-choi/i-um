// Monthly letter scheduler — unit tests for letter generation logic
// Mocks Anthropic and Supabase to test scheduling logic without real API calls

const mockCronSchedule = jest.fn();
jest.mock('node-cron', () => ({ schedule: mockCronSchedule }));

const mockMaybeSingle = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockEq = jest.fn();
const mockGte = jest.fn();
const mockLt = jest.fn();
const mockOrder = jest.fn();
const mockIn = jest.fn();
const mockLimit = jest.fn();
const mockFrom = jest.fn();

jest.mock('../lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

const mockSendPush = jest.fn().mockResolvedValue(undefined);
jest.mock('../services/pushService', () => ({
  sendPushNotification: mockSendPush,
}));

const mockCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  }));
});

import { startMonthlyLetterScheduler } from '../workers/monthlyLetterScheduler';

describe('startMonthlyLetterScheduler', () => {
  it('매달 1일 새벽 2시 cron으로 등록된다', () => {
    startMonthlyLetterScheduler();
    expect(mockCronSchedule).toHaveBeenCalledWith(
      '0 2 1 * *',
      expect.any(Function),
    );
  });
});
