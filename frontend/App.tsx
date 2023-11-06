import React, { useState, useEffect } from 'react';
import Page from './components/Page';
import EnterId from './components/EnterId';
import PickParticipant from './components/PickParticipant';
import ViewPresent from './components/ViewPresent';

interface AppProps {
    id: string;
}

export default function App({ id }: AppProps) {
    const [santaInfo, setSantaInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [santaId, setSantaId] = useState(false);
    const [viewPresent, setViewPresent] = useState(false);
    const [participantName, setParticipantName] = useState(null);
    const [giveToList, setGiveToList] = useState(null);
    const getBaseURL = () => {
        return location.protocol + '//' + location.host;
    };
    const fetchSantaInformation = async (_id) => {
        const baseURL = getBaseURL();
        const url = `${baseURL}/santa/${_id}`;
        const santaInfo = await fetch(url).then((res) => res.json());
        return santaInfo;
    };
    let _id = id;
    const handleParticipantClick = (participantId) => {
        document.querySelector('.card').style.display = 'none';
        let listPresents = [];
        const participantIdToName = {};
        for (const participant of santaInfo.participants) {
            participantIdToName[participant.id] = participant.name;
        }
        setParticipantName(participantIdToName[participantId]);
        for (const present of santaInfo.presents) {
            if (present.fromParticipantId === participantId) {
                listPresents.push(participantIdToName[present.toParticipantId]);
            }
        }
        setGiveToList(listPresents);
        setViewPresent(true);
    };
    const joinSanta = () => {
        _id = document.querySelector('#santaId').value;
        fetchSantaInformation(_id).then((santaInfo) => {
            setLoading(false);
            setSantaInfo(santaInfo);
            setSantaId(true);
            const searchParams = new URLSearchParams(document.location.search);
            searchParams.set('id', _id);
            window.location.search = searchParams;
        });
    };
    useEffect(() => {
        if (_id === undefined) {
            if (document === undefined) {
                _id = 1;
                fetchSantaInformation(_id).then((santaInfo) => {
                    setLoading(false);
                    setSantaInfo(santaInfo);
                    setSantaId(true);
                });
            } else {
                const searchParams = new URLSearchParams(
                    document.location.search
                );
                _id = searchParams.get('id');
                if (_id !== null) {
                    fetchSantaInformation(_id).then((santaInfo) => {
                        setLoading(false);
                        setSantaInfo(santaInfo);
                        setSantaId(true);
                    });
                } else {
                    setLoading(false);
                }
            }
        }
    }, []);
    if (loading) {
        return (
            <Page>
                <div>Loading...</div>
            </Page>
        );
    }
    return (
        <Page>
            {santaId ? (
                <PickParticipant
                    participants={santaInfo.participants}
                    handleParticipantClick={handleParticipantClick}
                ></PickParticipant>
            ) : (
                <EnterId joinSanta={() => joinSanta()}></EnterId>
            )}
            {viewPresent ? (
                <ViewPresent
                    participantName={participantName}
                    giveToList={giveToList}
                ></ViewPresent>
            ) : null}
        </Page>
    );
}
