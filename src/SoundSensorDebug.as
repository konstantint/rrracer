/**
 * Flash-based simplistic pitch-detection component.
 * 
 * Copyright (c) Konstantin Tretyakov.
 * 
 * Released under MIT Licence.
 */
package
{
    import __AS3__.vec.Vector;
    import flash.display.Sprite;
    import flash.events.*;
    import flash.media.Microphone;
    import flash.text.*;
    import flash.utils.*;
 	import flash.system.Security;
	import flash.system.SecurityPanel;
    import flash.external.ExternalInterface;
	import flash.display.BitmapData;
	
    [SWF(width='600', height='400', frameRate='30', backgroundColor='0xFFFFFF')]
    public class SoundSensorDebug extends Sprite {
		private var m_pitch:PitchDetector;
		private var m_mic:MicrophoneListener;		
        private const UPDATE_PERIOD:int = 50;       // Period of spectrum updates (ms)
        private var m_timer:Timer;                   // Timer for updating spectrum
		private var m_currentPitch:Number;
		private var m_frequencies:Vector.<Number>;		
		private var m_pitchText:TextField;
		private var m_debugOut:TextField;
		
        public function SoundSensorDebug() {
			m_mic = new MicrophoneListener();
			m_pitch = new PitchDetector(m_mic);
			m_frequencies = m_mic.getFrequencies();
			m_pitchText = new TextField();
			addChild(m_pitchText);
			m_debugOut = new TextField();
			m_debugOut.x = 200;
			m_debugOut.autoSize = TextFieldAutoSize.LEFT;
			addChild(m_debugOut);
			
            // Set up a timer to do periodic updates of the spectrum
            m_timer = new Timer(UPDATE_PERIOD);
            m_timer.addEventListener(TimerEvent.TIMER, update);
            m_timer.start();

			// Link with external interface
			var eint: ExternalInterfaceHelper = new ExternalInterfaceHelper(m_debugOut);
			eint.addCallback("getPitch", function():Number { return m_currentPitch; } );
			
			var settingsDialogChecker: SettingsScreenVisibilityChecker = new SettingsScreenVisibilityChecker(stage);
			m_mic.ensureMicrophoneEnabled(function():void { ExternalInterface.call("microphoneReady"); },
										  function():Boolean { return settingsDialogChecker.settingsScreenVisible(); } );
         }
	     private function update(event:Event):void  {
			m_currentPitch = m_pitch.getPitch();
			m_pitchText.text = (m_currentPitch == -1) ? "No pitch detected" : m_currentPitch.toString();
         }
	}
}