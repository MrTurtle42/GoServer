document.addEventListener('DOMContentLoaded', function () {
  
})
 
//Funktion zur Latenzermittlung
/*function getTime(){
for (var i=0;i<PlayerAmount;i++){
//Zeitpunkt des Videostreams
 var currentTime = players[i].currentTime;
//Abspieldauer bis jetzt 
 var playTime = (Date.now()-startTimes[i])/1000; //1000 ms = 1 s
//Latenz in Sekunden
 var delay = playTime - currentTime;
//Loggen von Latenz, bis jetzt maximal 0,8-0,9 s bei 4 Videos unter Auslastung
 var txt = delay.toFixed(3);
 outputs[i].innerHTML = txt;
}

}*/


//Alle Player starten, da Browser Autoplay von mehreren Streams unterbindet, ohne Interaktion vom Nutzer
/*function startAllPlayers (players){
  for (var i=0;i<PlayerAmount;i++){
    //getElementsByTagName gibt eine HTMLCollection, Zugriff über Collections.item(index)
    startPlay(players.item(i), streamApiUrl[i], i);
  }
}*/
//Funktion für RTC Verbindung zum Server und abspielen des gewünschten Streams
//Parameter sind HTML-Video Element und die Url des gewünschten Streams (API-Definition)
function startPlay (videoEl, url, i) {
    //Neue Verbindung definieren
    const webrtc = new RTCPeerConnection({
      sdpSemantics: 'unified-plan'
    })

    //Neuer Track, der über die Verbindung gesendet wird, wird an übergebenen Player gegeben
    webrtc.ontrack = function (event) {
      console.log(event.streams.length + ' track is delivered')
      videoEl.srcObject = event.streams[0]
      videoEl.play()
    }
    //WebRTC beidseitige Kommunikation
    //Transceiver ist transmitter und reciever, sendrecv = send and recieve, d.h. Transceiver kommuniziert in beide Richtungen
    webrtc.addTransceiver('video', { direction: 'sendrecv' })

    //Jedes Mal, wenn die Verbindung verhandelt werden muss, wird dies durch die async function gemacht
    //async gibt ein Promise wieder, der Code kann weiterlaufen, und die Funktion läuft im Hintergrund weiter
    webrtc.onnegotiationneeded = async function handleNegotiationNeeded () {

    //Initierung eines SDP-Angebot (Session Description Protocol), entspricht der Beschreibung der Peer-to-Peer-Verbindung
    const offer = await webrtc.createOffer()
    //Lokale Beschreibung der Verbindung 
    await webrtc.setLocalDescription(offer)
    //

      fetch(url, {
        method: 'POST',
        body: new URLSearchParams({ data: btoa(webrtc.localDescription.sdp) })
      })

        .then(response => response.text())
        .then(data => {
          //Lokale Beschreibung für Server setzen, Promise als return
            const TestPromise = webrtc.setRemoteDescription( 
              new RTCSessionDescription({ type: 'answer', sdp: atob(data) })

            )
            //Bei Fehlermeldung (Stream Offline) => Poster setzen, hier Schriftzug mit Kamera offline, beliebig ersetzen
            TestPromise.catch(err => videoEl.setAttribute('poster', 'Static.png')); 
        })
    
    }
    //neuen Datenchannel für Lognachrichten
    const webrtcSendChannel = webrtc.createDataChannel('rtsptowebSendChannel')
    //loggen, wenn Verbindung sich öffnet
    webrtcSendChannel.onopen = (event) => {
      console.log(`${webrtcSendChannel.label} has opened`)
      webrtcSendChannel.send('ping')
    //Startzeit der offenen Verbindung, um Latenz zwischen Server und Client zu ermitteln (Videolatenz)
      
        //startTimes[i] = Date.now(); 
      
    }
    //loggen, wenn Verbindung sich schließt, Aufruf von startPlay, um Verbindung automatisch neuzustarten
    webrtcSendChannel.onclose = (_event) => {
      console.log(`${webrtcSendChannel.label} has closed`)
      startPlay(videoEl, url)
    }
    //Nachrichten vom Server loggen
    webrtcSendChannel.onmessage = event => {console.log(event.data)
    }
  }