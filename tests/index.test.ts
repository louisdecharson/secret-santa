import { allocatePresentToParticipants } from '../src/index';
import t from 'tap';

const logSet = (mySet) => {
    const setToArray = Array.from(mySet);
    const result = setToArray.join(', ');
    return result;
};
const validateAllocation = (test, participants, nbOfPresents, allocation) => {
    const nbPresentsGiven = {};
    const nbPresentsReceived = {};
    for (const [giver, receivers] of Object.entries(allocation)) {
        nbPresentsGiven[giver] = new Set(receivers);
        for (const receiver of receivers) {
            if (!(receiver in nbPresentsReceived)) {
                nbPresentsReceived[receiver] = new Set();
            }
            nbPresentsReceived[receiver].add(giver);
        }
    }
    for (const participant of participants) {
        test.equal(nbPresentsGiven[participant].size, nbOfPresents);
        if (nbPresentsGiven[participant].size !== nbOfPresents) {
            console.log(
                `${participant} gives ${
                    nbPresentsGiven[participant].size
                }: ${logSet(nbPresentsGiven[participant])}`
            );
        }
        test.equal(nbPresentsReceived[participant].size, nbOfPresents);
        if (nbPresentsReceived[participant].size !== nbOfPresents) {
            console.log(
                `${participant} receives ${
                    nbPresentsReceived[participant].size
                } from: ${logSet(nbPresentsReceived[participant])}`
            );
        }
    }
};

// Test 1
t.test('Test allocation', (t) => {
    let participants = ['Alice', 'Bob', 'Carol', 'David', 'Emily', 'Fiona'];
    let nbOfPresents = 4;
    let resultAllocation = allocatePresentToParticipants(
        participants,
        nbOfPresents
    );
    validateAllocation(t, participants, nbOfPresents, resultAllocation);
});
