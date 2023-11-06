import React from 'react';

type ViewPresentProps = {
    participantName: string;
    giveToList: string[];
};

export default function ViewPresent({
    participantName,
    giveToList
}: ViewPresentProps) {
    const listPresents = giveToList.map((name) => <li key={name}>{name}</li>);
    return (
        <div className="action">
            <h4>Welcome {participantName} 🦌!</h4>
            <p>🎁 You need to find a present for:</p>
            <ul>{listPresents}</ul>
        </div>
    );
}
