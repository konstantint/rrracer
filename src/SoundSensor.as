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
	import flash.utils.Timer;
    import flash.events.*;
	import flash.external.ExternalInterface;
 
    [SWF(width='220', height='150', frameRate='30', backgroundColor='0xFFFFFF')]
    public class SoundSensor extends Sprite {
		private var m_pitch:PitchDetector;
		private var m_mic:MicrophoneListener;		
        private const UPDATE_PERIOD:int = 50;       // Period of spectrum updates (ms)
        private var m_timer:Timer;                  // Timer for updating spectrum
		private var m_currentPitch:Number;
		private var m_frequencies:Vector.<Number>;
		
        public function SoundSensor() {
			m_mic = new MicrophoneListener();
			m_pitch = new PitchDetector(m_mic);
			m_frequencies = m_mic.getFrequencies();
			
            // Set up a timer to do periodic updates of the spectrum
            m_timer = new Timer(UPDATE_PERIOD);
            m_timer.addEventListener(TimerEvent.TIMER, update);
            m_timer.start();

			// Link with external interface
			var eint: ExternalInterfaceHelper = new ExternalInterfaceHelper(null);
			eint.addCallback("getPitch", function():Number { return m_currentPitch; } );
			
			// Ensure microphone is enabled
			var settingsDialogChecker: SettingsScreenVisibilityChecker = new SettingsScreenVisibilityChecker(stage);
			m_mic.ensureMicrophoneEnabled(function():void { ExternalInterface.call("microphoneReady"); },
										  function():Boolean { return settingsDialogChecker.settingsScreenVisible(); } );
			
         }
	     private function update(event:Event):void  {
			m_currentPitch = m_pitch.getPitch();
         }
	}
}