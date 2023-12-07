import { Elysia, t } from 'elysia';
import { html } from '@elysiajs/html';
import { staticPlugin } from '@elysiajs/static';
import { PrismaClient } from '@prisma/client';
// import { testPostBody } from './routes.tsx'
import { createElement } from 'react';
import { renderToReadableStream, renderToString } from 'react-dom/server';
import App from '../frontend/App.tsx';

await Bun.build({
    entrypoints: ['./frontend/index.tsx'],
    outdir: './public'
});
const db = new PrismaClient();
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;
const app = new Elysia().use(html()).use(staticPlugin()).listen({
    port: port,
    hostname: hostname
});

app.get('/', () => Bun.file('public/index.html').text());
app.get('/admin', () => Bun.file('public/pages/admin.html').text());
app.get('/create', () => Bun.file('public/pages/create.html').text());
app.post('/create', async ({ set, body }) => {
    const createdSanta = await createSanta(body);
    return createdSanta;
});
app.get(
    '/join',
    async ({ query }) => {
        // create our react App component
        const app = createElement(App, query);
        const stream = await renderToReadableStream(app, {
            bootstrapScripts: ['/public/index.js']
        });
        return new Response(stream, {
            headers: { 'Content-Type': 'text/html' }
        });
    },
    {
        query: t.Object({
            id: t.Optional(t.String())
        })
    }
);
app.get('/santa', async () => {
    return db.santa.findMany({
        orderBy: [
            {
                createdAt: 'desc'
            }
        ],
        include: {
            participants: true,
            presents: true
        }
    });
});
app.get('/santa/:id', async ({ params: { id } }) => {
    return db.santa.findUnique({
        where: {
            id: parseInt(id)
        },
        include: {
            participants: {
                include: {
                    wishList: true
                }
            },
            presents: true
        }
    });
});

app.get('/participant', async () => {
    return db.participant.findMany({
        include: {
            presentsReceived: true,
            presentsGiven: true
        }
    });
});
app.get('/participant/:id', async ({ params: { id } }) => {
    return db.participant.findUnique({
        where: {
            id: parseInt(id)
        },
        include: {
            presentsReceived: true,
            presentsGiven: true
        }
    });
});

app.get('/wish', async () => {
    return db.wish.findMany({
        include: {
            participant: true
        }
    });
});
app.post('/wish', async ({ body }) => {
    const createdWish = await db.participant.update({
        where: { id: body.participantId },
        data: {
            wishList: {
                create: [{ item: body.item }]
            }
        },
        include: {
            wishList: true
        }
    });
    return createdWish;
});

app.get('/wish/:id', async ({ params: { id } }) => {
    return db.wish.findUnique({
        where: {
            id: parseInt(id)
        },
        include: {
            participant: true
        }
    });
});
app.delete('/wish/:id', async ({ params: { id } }) => {
    const deleteWish = await db.wish.deleteMany({
        where: {
            id: parseInt(id)
        }
    });
});
app.put('/wish/:id', async ({ params: { id }, body }) => {
    return db.wish.update({
        where: {
            id: parseInt(id)
        },
        data: body
    });
});

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
const createSanta = async (formData) => {
    const parsedData = {
        name: formData.name || null,
        numberOfPresent: parseInt(formData.numberOfPresent),
        participants: {
            create: []
        },
        id: getRandomInteger(),
        budget: formData.budget || null
    };
    for (const [key, value] of Object.entries(formData)) {
        if (key.startsWith('participants_')) {
            parsedData.participants.create.push({
                name: value
            });
        }
    }
    const createdSanta = await db.santa.create({
        data: parsedData,
        include: {
            participants: true
        }
    });
    const participantsIds = [];
    for (const participant of createdSanta.participants) {
        participantsIds.push(participant.id);
    }
    const presentsAllocation = allocatePresentToParticipants(
        participantsIds,
        parsedData.numberOfPresent
    );
    for (const [giver, receivers] of Object.entries(presentsAllocation)) {
        for (const receiver of receivers) {
            const createdPresent = await db.present.create({
                data: {
                    fromParticipantId: parseInt(giver),
                    toParticipantId: parseInt(receiver),
                    santaId: createdSanta.id
                }
            });
        }
    }
    const createdSantaWithPresents = await db.santa.findUnique({
        where: {
            id: createdSanta.id
        },
        include: {
            participants: true,
            presents: true
        }
    });
    return createdSantaWithPresents;
};

function getRandomInteger(): number {
    return Math.floor(Math.random() * 1000000);
}

const allocatePresentToParticipants = (
    participants: Array<string>,
    numberOfPresents: number
) => {
    const allocation = {};
    const receivers = [];
    let allocationPossible = false;
    const resetAllocation = () => {
        receivers.length = 0;
        for (const giver of participants) {
            allocation[giver] = [];
        }
        for (let i = 0; i < numberOfPresents; i++) {
            receivers.push(...participants.slice());
        }
        allocationPossible = true;
    };

    for (let i = 0; i < participants.length; i++) {
        if (!allocationPossible) {
            resetAllocation();
        }
        const giver = participants[i];

        for (let j = 0; j < numberOfPresents; j++) {
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
export { allocatePresentToParticipants };
