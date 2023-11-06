import React from 'react';
import type { Participant } from '@prisma/client';
import UserOption from './UserOption';

type PickParticipantProps = {
    participants: Participant[];
    handleParticipantClick: (number) => void;
};

export default function PickParticipant({
    participants,
    handleParticipantClick
}: PickParticipantProps) {
    const listParticipants = participants.map((participant) => (
        <UserOption
            name={participant.name}
            key={participant.id}
            onParticipantClick={() => handleParticipantClick(participant.id)}
        />
    ));
    return (
        <div id="pickParticipant">
            <div className="card">
                <h4>Who are you ?</h4>
                <div className="text-gold italic">
                    Click on your name (don't cheat 🍂)
                </div>
                <div className="participant-list">{listParticipants}</div>
            </div>
        </div>
    );
}
