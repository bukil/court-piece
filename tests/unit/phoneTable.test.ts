import {expect,it} from 'vitest';
import {lowResourceDevice} from '../../src/hooks/usePhoneTable';
it('uses conservative device hints rather than assuming missing APIs mean a slow device',()=>{
 expect(lowResourceDevice({})).toBe(false);
 expect(lowResourceDevice({hardwareConcurrency:8})).toBe(false);
 expect(lowResourceDevice({hardwareConcurrency:4})).toBe(true);
 expect(lowResourceDevice({deviceMemory:2,hardwareConcurrency:8})).toBe(true);
});
it('uses lighter previews when the user explicitly requests data saving',()=>{
 expect(lowResourceDevice({deviceMemory:8,hardwareConcurrency:16,connection:{saveData:true}})).toBe(true);
 expect(lowResourceDevice({deviceMemory:8,hardwareConcurrency:16,connection:{saveData:false}})).toBe(false);
});
