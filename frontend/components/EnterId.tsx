import React from 'react';

type EnterIdProps = {
    joinSanta: () => void;
};
export default function EnterId({ joinSanta }: EnterIdProps) {
    return (
        <div id="joinForm">
            <h4>Join a Secret Santa 🎄</h4>
            <p>Enter ID for the Secret Santa you want to join:</p>
            <input id="santaId" placeholder="Santa ID" maxLength="6" required />
            <div className="button-container">
                <button type="button" className="button" onClick={joinSanta}>
                    Join
                </button>
            </div>
        </div>
    );
}
