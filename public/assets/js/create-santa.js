const $ = (selector) => document.querySelector(selector);
const urlParams = new URLSearchParams(window.location.search);
let santaId = urlParams.get('santaId');
const baseURL = location.protocol + '//' + location.host;
$('#presents_allocation').style.display = 'none';
let presentsAllocation, idToName;
let presentsAllocated = false;

// Functions
// =========
let numberOfParticipants = 0;
const createParticipant = () => {
    let participantNb = numberOfParticipants + 1;
    let html = `
       <div class="input-container" id="participant_${participantNb}">
         <input type="text" name="participants_${participantNb}_name" placeholder="Name"/>`;
    if (participantNb > 1) {
        html += `<button class="delete-button" type="button" onclick="deleteParticipant(${participantNb})">−</button>`;
    }
    html += '</div>';
    document
        .getElementById('participants_end')
        .insertAdjacentHTML('beforebegin', html);
    numberOfParticipants += 1;
};
const generateAllocation = () => {
    $('#presents_allocation').style.display = 'none';

    // reset allocation
    $('#santaPresents_0').innerHTML = '';

    const formData = getForm();
    const errorForm = validateForm(formData);
    if (errorForm.length === 0) {
        const numberOfPresent = parseInt(formData.get('numberOfPresent'));
        // get list of participants
        const participantsIds = [];
        idToName = {};
        let participantId = 0;
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('participants_')) {
                participantsIds.push(participantId);
                idToName[participantId] = value;
                participantId += 1;
            }
        }
        // define givers and receivers
        presentsAllocation = allocatePresentToParticipants(
            participantsIds,
            numberOfPresent
        );
        for (const [giver, receivers] of Object.entries(presentsAllocation)) {
            for (const receiver of receivers) {
                $(
                    '#santaPresents_0'
                ).innerHTML += `<li>${idToName[giver]} gives to ${idToName[receiver]}</li>`;
            }
        }
        $('#allocateSantaText').innerHTML =
            'Not happy with the allocation ? Allocate Santas again';
        $('#allocateSantaButton').innerHTML = '🔄 Reallocate Santas';
        $('#presents_allocation').style.display = 'block';
        presentsAllocated = true;
    } else {
        displayErrorForm(errorForm);
    }
};
const allocatePresentToParticipants = (participants, numberOfPresent) => {
    const allocation = {};
    const receivers = [];
    let allocationPossible = false;
    const resetAllocation = () => {
        receivers.length = 0;
        for (const giver of participants) {
            allocation[giver] = [];
        }
        for (let i = 0; i < numberOfPresent; i++) {
            receivers.push(...participants.slice());
        }
        allocationPossible = true;
    };

    for (let i = 0; i < participants.length; i++) {
        if (!allocationPossible) {
            resetAllocation();
        }
        const giver = participants[i];

        for (let j = 0; j < numberOfPresent; j++) {
            let validReceivers = receivers.filter(
                (receiver) =>
                    receiver !== giver &&
                    allocation[giver].indexOf(receiver) === -1
            );

            if (validReceivers.length === 0) {
                // If there are no valid receivers for the current giver,
                // reset and start again
                j = -1;
                allocationPossible = false;
                break;
            }

            const randomIndex = Math.floor(
                Math.random() * validReceivers.length
            );
            const receiver = validReceivers[randomIndex];
            allocation[giver].push(receiver);
            receivers.splice(receivers.indexOf(receiver), 1);
        }
        if (!allocationPossible) {
            i = -1;
        }
    }

    return allocation;
};

// Create form
const createSantaForm = () => {
    // initiate Santa with one participant
    createParticipant();
};

// Functions
const deleteParticipant = (participant_nb) => {
    document.getElementById(`participant_${participant_nb}`).remove();
};

// Validate & Submit
const getForm = () => {
    const form = $('#santaForm');
    const formData = new FormData(form);
    return formData;
};
const validateForm = (formData) => {
    let nbParticipants = 0;
    let nbPresents = parseInt(formData.get('numberOfPresent'));
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('participants_')) {
            nbParticipants += 1;
        }
    }
    if (nbParticipants <= nbPresents) {
        const nbPresentsMax = nbParticipants - 1;
        return `Error: For ${nbParticipants} participants, the maximum number of presents is ${nbPresentsMax}`;
    }
    return '';
};
const displayErrorForm = (errorForm) => {
    $('#error').innerHTML = errorForm;
};

const submitSantaForm = () => {
    formData = getForm();
    const errorForm = validateForm(formData);
    if (!presentsAllocated) {
        generateAllocation();
    }
    formData.append('presentsAllocation', JSON.stringify(presentsAllocation));
    formData.append('idToName', JSON.stringify(idToName));
    if (errorForm.length === 0) {
        fetch(document.URL, { method: 'post', body: formData })
            .then((res) => res.json())
            .then((createdSanta) => {
                urlParams.set('santaId', createdSanta.id);
                window.location.search = urlParams;
                displaySanta(createdSanta);
            })
            .catch((error) => {
                $(
                    '#error'
                ).innerHTML = `Internal server error when creating the santa. There is nothing you can do on your side unfortunately. Reach out to developers with the error message: ${error}`;
                console.log(error);
            });
    } else {
        displayErrorForm(errorForm);
    }
};
// Display created Santa form
const displaySanta = (santaInfo) => {
    if (santaInfo.name) {
        $('#santaName').innerHTML = santaInfo.name;
        $('#nameDisplay').style.display = 'block';
    } else {
        $('#nameDisplay').style.display = 'none';
    }
    if (santaInfo.budget) {
        $('#santaBudget').innerHTML = santaInfo.budget;
        $('#budgetDisplay').style.display = 'block';
    }
    $('#santaId').innerHTML = santaInfo.id;
    santaId = santaInfo.id;
    $(
        '#santaNumberOfPresent'
    ).innerHTML = `${santaInfo.numberOfPresent} present per participant`;
    const idToName = {};
    for (const participant of santaInfo.participants) {
        idToName[participant.id] = participant.name;
        $('#santaParticipants').innerHTML += `<li>${participant.name}</li>`;
    }
    $(
        '#nbParticipants'
    ).innerHTML = `${santaInfo.participants.length} participants`;
    for (const present of santaInfo.presents) {
        $('#santaPresents').innerHTML += `<li>${
            idToName[present.fromParticipantId]
        } gives to ${idToName[present.toParticipantId]}</li>`;
    }
    $('#view').style.display = 'block';
    $('#create').style.display = 'none';
};
const shareSanta = () => {
    let santaURL = `${baseURL}/join?id=${santaId}`;
    navigator.clipboard.writeText(santaURL);
    $(
        '#shareSantaText'
    ).innerHTML = `Copied link <a href=${santaURL}>${santaURL}</a> to your clipboard, share it with your friends !`;
};

// Display existing santa form if existing otherwise display create form
if (santaId) {
    fetch(`${baseURL}/santa/${santaId}`)
        .then((res) => res.json())
        .then((santaInfo) => displaySanta(santaInfo));
} else {
    $('#create').style.display = 'block';
    createSantaForm();
}
