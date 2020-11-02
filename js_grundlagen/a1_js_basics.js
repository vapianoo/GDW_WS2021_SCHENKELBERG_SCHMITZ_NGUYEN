//#1
/* var name = "kephas"
console.log(name) */



//#2
/* const maxRating = 5
let actualRating = 3
maxRating = 7
actualRating = 7 */



//#3
//Synchrone Variante
/* const readline = require('readline-sync');
//Waiting for User Response
let newRating = readline.question("New Rating: ")
if (newRating <= maxRating || newRating > 0) {
    actualRating = newRating
    console.log(actualRating)
}
else {
    console.log("Bitte einen Wert zwischen 1 und 5 eingeben.")
} */

//Asynchon | Arrow Function: do something with "value"
/* const readline = require('readline');
const rl = readline.createInterface({ 
    input: process.stdin,
    output: process.stdout 
});

rl.question("New Rating ", (value) => {
    if (value <= maxRating || value > 0) {
        actualRating = value
        console.log(`New Rating: ${actualRating}`)
    }
    else {
        console.log("Bitte gib ein Rating zwischen 1 und 5 ein.")
    }

    rl.close()
}); */



//#3
/* function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}
let sum = 0
let countRating
let totalRating

for (let i = 0; i < 5; i++) {
    countRating = i + 1
    let random = getRndInteger(1, 5)
    sum += random
    totalRating = sum / countRating
    console.log(`Number of Ratings: ${countRating}, Given Rating: ${random}, Overall Rating: ${totalRating}`)
} */



//#4
//Get random integer between 2 values
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function calculateRating (numberOfTimes) {

    let sum = 0
    let countRating
    let totalRating

    for (let i = 0; i < numberOfTimes; i++) {
        let random = getRndInteger(1, 5)
        countRating = i + 1
        sum += random
        totalRating = sum / countRating
    }
    return totalRating
}

let rating = calculateRating(5)
console.log(rating)


