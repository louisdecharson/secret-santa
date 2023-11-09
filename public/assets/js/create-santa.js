const $ = (selector) => document.querySelector(selector);
const urlParams = new URLSearchParams(window.location.search);
let santaId = urlParams.get('santaId');
const baseURL = location.protocol + '//' + location.host;
let numberOfParticpants = 0;
const createParticipant = () => {
    let participantNb = numberOfParticpants + 1;
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
    numberOfParticpants += 1;
};

const createSantaForm = () => {
    createParticipant();
};
const deleteParticipant = (participant_nb) => {
    document.getElementById(`participant_${participant_nb}`).remove();
};

const validateSanta = (formData) => {
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

const submitSantaForm = () => {
    const form = $('#santaForm');
    const formData = new FormData(form);
    const errorForm = validateSanta(formData);
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
        $('#error').innerHTML = errorForm;
    }
};
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

if (santaId) {
    fetch(`${baseURL}/santa/${santaId}`)
        .then((res) => res.json())
        .then((santaInfo) => displaySanta(santaInfo));
} else {
    $('#create').style.display = 'block';
    createSantaForm();
}
