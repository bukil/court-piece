import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  stopRoom: vi.fn(), stopHand: vi.fn(), stopLocal: vi.fn(),
  room: vi.fn(), hand: vi.fn(), localRoom: vi.fn(),
}));
vi.mock('../src/services/firebaseSettings', () => ({ isFirebaseConfigured: () => true }));
vi.mock('../src/services/firestoreService', () => ({ firestoreService: { subscribeRoom: mocks.room, subscribePrivateHand: mocks.hand } }));
vi.mock('../src/services/localSimulator', () => ({ localSimulator: { subscribeRoom: mocks.localRoom } }));
import { roomService } from '../src/services/roomService';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.room.mockReturnValue(mocks.stopRoom);
  mocks.hand.mockReturnValue(mocks.stopHand);
  mocks.localRoom.mockReturnValue(mocks.stopLocal);
});

describe('deferred cloud subscriptions', () => {
  it('does not connect after the screen unmounts before the module loads', async () => {
    const stopRoom = roomService.subscribeRoom('test-room', vi.fn());
    const stopHand = roomService.subscribePrivateHand('test-room', 'player', vi.fn());
    stopRoom();
    stopHand();
    await vi.dynamicImportSettled();
    expect(mocks.room).not.toHaveBeenCalled();
    expect(mocks.hand).not.toHaveBeenCalled();
  });

  it('releases cloud room and private-hand connections on unmount', async () => {
    const stopRoom = roomService.subscribeRoom('test-room', vi.fn());
    const stopHand = roomService.subscribePrivateHand('test-room', 'player', vi.fn());
    await vi.dynamicImportSettled();
    expect(mocks.room).toHaveBeenCalledTimes(1);
    expect(mocks.hand).toHaveBeenCalledTimes(1);
    stopRoom();
    stopHand();
    expect(mocks.stopRoom).toHaveBeenCalledTimes(1);
    expect(mocks.stopHand).toHaveBeenCalledTimes(1);
  });

  it('never falls back to a local table when the online room is missing', async () => {
    const stop = roomService.subscribeRoom('test-room', vi.fn());
    await vi.dynamicImportSettled();
    const callback = mocks.room.mock.calls[0][1];
    callback(null);
    callback(null);
    expect(mocks.localRoom).not.toHaveBeenCalled();
    stop();
    expect(mocks.stopLocal).not.toHaveBeenCalled();
    expect(mocks.stopRoom).toHaveBeenCalledTimes(1);
  });
});
