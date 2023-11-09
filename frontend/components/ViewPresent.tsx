import React, { useState, useEffect } from 'react';
import type { Wish } from '@prisma/client';
import getBaseURL from '../utils';

type ViewPresentProps = {
    participantId: integer;
    participantName: string;
    giveToList: string[];
    wishList: Wish[];
};

function WishItem({ id, onChange, onDelete, item }) {
    const [visible, setVisible] = useState(true);
    const [debouncedText, setDebouncedText] = useState(item);

    const deleteWish = () => {
        setVisible(false);
    };
    useEffect(() => {
        if (!item || item === debouncedText) return;
        const timeout = setTimeout(() => onChange(id, debouncedText), 500);
        return () => clearTimeout(timeout);
    }, [item, debouncedText]);
    return (
        <div className="input-container">
            <input
                type="text"
                name={`wish_${id}`}
                value={debouncedText}
                onChange={(e) => setDebouncedText(e.target.value)}
            />
            <button
                className="delete-button"
                type="button"
                onClick={() => onDelete(id)}
            >
                Delete
            </button>
        </div>
    );
}
function WishList({ wishList, onWishChange, onWishDelete, loading = false }) {
    return wishList.length > 0 ? (
        <div id="wishList">
            {wishList.map((wish) => (
                <WishItem
                    key={wish.id}
                    id={wish.id}
                    onChange={onWishChange}
                    onDelete={onWishDelete}
                    item={wish.item}
                />
            ))}
        </div>
    ) : (
        <div className="italic text-muted">
            {loading
                ? 'Loading...'
                : 'No wishes added yet, you can add a wish using the field below'}
        </div>
    );
}
function AddWishForm({ onWishSubmit }) {
    const [value, setValue] = useState('');
    return (
        <form
            className="new-wish-form"
            onSubmit={(e) => {
                e.preventDefault();
                onWishSubmit(value, e);
                setValue('');
            }}
        >
            <input
                type="text"
                id="input-new-wish"
                placeholder="Add new wish..."
                name="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            <button type="submit">Add Wish</button>
        </form>
    );
}

export default function ViewPresent({
    participantId,
    participantName,
    giveToList,
    initialWishList,
    budget
}: ViewPresentProps) {
    const [wishList, setWishList] = useState(initialWishList);
    const listBuddies = giveToList.map((participant) => (
        <li className="buddy" key={participant.id}>
            ☃️ {participant.name}
            {participant.wishList.length > 0 ? (
                <div className="text-gold italic">
                    {participant.name}'s wish list:
                    <ul>
                        {participant.wishList.map((wish) => (
                            <li key={wish.id}>{wish.item}</li>
                        ))}
                    </ul>
                </div>
            ) : (
                ''
            )}
        </li>
    ));
    const baseURL = getBaseURL();
    const wishURL = `${baseURL}/wish`;

    const onWishChange = async (wishId, wishText) => {
        const updatedWish = {
            id: wishId,
            item: wishText
        };
        const wishURLId = `${wishURL}/${wishId}`;
        await fetch(wishURLId, {
            method: 'put',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedWish)
        }).then((res) => res.json());
        setWishList((oldWishList) =>
            oldWishList.map((wish) =>
                wish.id === wishId
                    ? {
                          ...wish,
                          ...updatedWish
                      }
                    : wish
            )
        );
    };
    const onWishDelete = async (wishId) => {
        const wishURLId = `${wishURL}/${wishId}`;
        await fetch(wishURLId, { method: 'delete' });
        setWishList((wish) => wish.filter(({ id }) => id !== wishId));
    };

    const onWishSubmit = async (wishText) => {
        await fetch(wishURL, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantId: parseInt(participantId),
                item: wishText
            })
        })
            .then((res) => res.json())
            .then((updatedParticipant) => {
                setWishList(updatedParticipant.wishList);
            });
    };
    return (
        <div className="action">
            <h3>Welcome to Secret Santa {participantName} 🦌!</h3>
            <h4>Your buddies</h4>
            <span className="text-gold italic">
                🎁 You need to find a present for the following person:
            </span>
            <ul className="buddies-list">{listBuddies}</ul>
            {budget ? (
                <div id="budgetDisplay">
                    <span>Budget 💸: </span>
                    <span className="text-gold" id="santaBudget">
                        {budget}
                    </span>
                </div>
            ) : (
                ''
            )}
            <h4>Your wish list</h4>
            <span className="text-gold italic">
                Help your Santa find the right present
            </span>
            <div className="wish-list-container">
                <WishList
                    wishList={wishList}
                    onWishChange={onWishChange}
                    onWishDelete={onWishDelete}
                />
                <AddWishForm onWishSubmit={onWishSubmit} />
            </div>
        </div>
    );
}
