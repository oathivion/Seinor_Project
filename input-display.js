document.getElementById('displayButton').addEventListener('click', () => {
    const inputText = document.getElementById('userInput').value;

    if (inputText.trim() === '') {
        alert('Please enter some text.');
        return;
    }

    const outputDiv = document.getElementById('outputDisplay');
    outputDiv.textContent = inputText;
    document.getElementById('userInput').value = ''; // Clear the input box
});
