import React, { useState, useEffect } from 'react';
import './flashcard-component.css';

export default function FlashCard({card, id}) {
    const [flipped, setFlipped] = useState(false);
    const [timerId, setTimerId] = useState(null);

    // const frontStyle = ( flipped ? {display: 'none'} : {display: 'inline'} );
    // const backStyle = ( flipped ? {display: 'inline'} : {display: 'none'} );
    // const frontStyle = ( flipped ? {visibility: 'hidden'} : {visiblity: 'visible'} );
    // const backStyle = ( flipped ? {visiblity: 'visible'} : {visibility: 'hidden'} );
    var frontStyle, backStyle;

    function handleClick() {
        setFlipped(!flipped);
        let card = document.getElementById(id);
        // console.log(card);
        // card.style.color = flipped ? "red" : "blue";
        // card.style.transition = "all 0.8 ease";
        // card.style.transform = flipped ? "": "rotateY(-180deg)";
        // console.log(card.style);
        let front = document.querySelectorAll(`#${id} > .card-front`)[0];
        let back = document.querySelectorAll(`#${id} > .card-back`)[0];
        console.log(front, back);
        back.style.transform = `rotateY(180deg)`;

        let frontRotation = 0;
        let backRotation = 180;

        function animation() {
            if(!flipped && frontRotation < 180) {
                card.style.transform = `rotateY(${frontRotation}deg)`;
                
                if(frontRotation > 89) {
                    front.style.visible = "hidden";
                }

                frontRotation++;
                backRotation--;
            }


            // else if(flipped && frontRotation > -180) {
            //     card.style.transform = `rotateY(${frontRotation}deg)`;
            //     frontRotation--;
            // }
            else {
                clearInterval(timerId);
            }
        }

        clearInterval(timerId);
        setTimerId(setInterval(animation), 100);
    }

    // useEffect will set flipped to false if the card is changed
    useEffect(()=>{setFlipped(false)}, [card]);

    return (
        <div id={id} className="card-container" onClick={()=>handleClick()}>
            <div className="card-front card-side" style={frontStyle}>
                <p>{card.front}</p>
            </div>

            <div className="card-back card-side" style={backStyle}>
                <p>{card.back}</p>
            </div>
        </div>
    )
}