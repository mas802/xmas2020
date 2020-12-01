export const trainInfo = async (caller) => { 
    let response, result;

    console.log('train info call start');
    try {
        response = await fetch('http://train.802.ch/train/?key=' + caller.label, {
            method: 'GET'
        });
        result = await response.json();
    } catch (error) {
        console.log(error, 'Train server is not available');
        caller.callback({"state":"error", "until":"-1"});
        return;
    } finally {
      console.log('train info call sen');
    }

    console.log(result);
    caller.callback( result );
}
