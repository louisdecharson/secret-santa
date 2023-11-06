import React from 'react';

type UserOptionProps = {
    name: string;
    onParticipantClick: (number) => void;
};
export default function UserOption({
    name,
    onParticipantClick
}: UserOptionProps) {
    return (
        <button
            type="button"
            className="participant-card"
            onClick={onParticipantClick}
        >
            {name}
        </button>
    );
}
