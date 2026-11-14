import React, { useRef, useState, useEffect } from 'react';
import alexAvatarImg from './assets/alex-rivera-hrd.png';
import AIHRD3D from './components/AIHRD3D';
import { CheckCircle2, Mic, BrainCircuit, Box, Image as ImageIcon } from 'lucide-react';
import './AIHRD.css';

/**
 * Komponen Visual HRD Alex Rivera (Mendukung Real-Time 3D GLB & 2D Procedural Rig)
 * Fitur:
 * - Real-Time 3D Model: Menggunakan file Meshy 3D GLB dengan studio lighting & 60 FPS physics
 * - Anti-Kaku: Head bobbing saat bicara, mengangguk menyimak saat kandidat bicara, mouse tracking
 * - Mode Toggle: Kemudahan berpindah antara 3D Avatar (Default) dan 2D Stylized
 */
export default function AIHRD({ 
  isSpeaking = false, 
  isLoading = false,
  isListening = false,
  status = null 
}) {
  const [is3DMode, setIs3DMode] = useState(false);

  const effectiveStatus = status || (
    isLoading ? 'thinking' :
    isSpeaking ? 'speaking' :
    isListening ? 'listening' :
    'idle'
  );

  const stageRef = useRef(null);
  const eyelidLeftRef = useRef(null);
  const eyelidRightRef = useRef(null);
  const mouthVectorRef = useRef(null);
  const statusRef = useRef(effectiveStatus);
  const animIdRef = useRef(null);

  useEffect(() => {
    statusRef.current = effectiveStatus;
  }, [effectiveStatus]);

  // Procedural Physics Engine untuk Mode 2D Fallback
  useEffect(() => {
    if (is3DMode) return; // Tidak perlu physics loop 2D jika mode 3D aktif

    const nowInit = performance.now();
    const rig = {
      startTime: nowInit,
      currentOpen: 0,
      currentWidth: 1,
      currentPitch: 0,
      currentYaw: 0,
      currentRoll: 0,
      currentHeadY: 0,
      nextBlinkTime: nowInit + 2500 + Math.random() * 2500,
      isBlinking: false,
      blinkStartTime: 0,
      blinkDuration: 200,
      hasDoubleBlinked: false,
      nextNodTime: nowInit + 2000,
      isNodding: false,
      nodStartTime: 0
    };

    const renderLoop = (now) => {
      const elapsed = now - rig.startTime;
      const currentStat = statusRef.current;

      // 1. Kedipan Mata 2D
      if (!rig.isBlinking && now >= rig.nextBlinkTime) {
        rig.isBlinking = true;
        rig.blinkStartTime = now;
        rig.blinkDuration = 180 + Math.random() * 40;
      }

      let blinkScale = 0;
      if (rig.isBlinking) {
        const blinkProgress = (now - rig.blinkStartTime) / rig.blinkDuration;
        if (blinkProgress <= 0.4) {
          blinkScale = blinkProgress / 0.4;
        } else if (blinkProgress <= 0.55) {
          blinkScale = 1;
        } else if (blinkProgress <= 1.0) {
          blinkScale = 1 - ((blinkProgress - 0.55) / 0.45);
        } else {
          rig.isBlinking = false;
          if (!rig.hasDoubleBlinked && Math.random() < 0.25) {
            rig.hasDoubleBlinked = true;
            rig.nextBlinkTime = now + 140;
          } else {
            rig.hasDoubleBlinked = false;
            rig.nextBlinkTime = now + 3200 + Math.random() * 2600;
          }
        }
      }

      if (eyelidLeftRef.current && eyelidRightRef.current) {
        const clampedBlink = Math.max(0, Math.min(1, blinkScale));
        const transformStr = `scaleY(${clampedBlink})`;
        const opacityStr = clampedBlink > 0.02 ? '1' : '0';

        eyelidLeftRef.current.style.transform = transformStr;
        eyelidLeftRef.current.style.opacity = opacityStr;

        eyelidRightRef.current.style.transform = transformStr;
        eyelidRightRef.current.style.opacity = opacityStr;
      }

      // 2. Gerakan Mulut 2D
      let targetOpen = 0;
      let targetWidth = 1;

      if (currentStat === 'speaking') {
        const wave1 = Math.sin(elapsed * 0.014);
        const wave2 = Math.sin(elapsed * 0.026);
        const wave3 = Math.sin(elapsed * 0.007);
        targetOpen = Math.max(0.12, (wave1 * 0.35 + wave2 * 0.25 + 0.45) * (0.8 + wave3 * 0.2));
        targetWidth = 1.0 + wave2 * 0.07;
      } else {
        targetOpen = 0;
        targetWidth = 1;
      }

      const lerpSpeed = currentStat === 'speaking' ? 0.2 : 0.14;
      rig.currentOpen += (targetOpen - rig.currentOpen) * lerpSpeed;
      rig.currentWidth += (targetWidth - rig.currentWidth) * 0.14;
      const jawY = rig.currentOpen * 2.2;

      if (mouthVectorRef.current) {
        const mouthActiveOpacity = Math.min(1, rig.currentOpen * 1.3);
        mouthVectorRef.current.style.opacity = mouthActiveOpacity.toFixed(3);
        mouthVectorRef.current.style.transform = `scale(${rig.currentWidth.toFixed(3)}, ${(0.8 + rig.currentOpen * 0.35).toFixed(3)}) translateY(${jawY.toFixed(2)}px)`;
      }

      // 3. Gestur Kepala 2D
      let targetPitch = 0;
      let targetYaw = 0;
      let targetRoll = 0;
      let targetHeadY = 0;

      if (currentStat === 'speaking') {
        targetPitch = Math.sin(elapsed * 0.003) * 1.5 + Math.sin(elapsed * 0.006) * 0.6;
        targetYaw = Math.cos(elapsed * 0.0022) * 1.2;
        targetRoll = Math.sin(elapsed * 0.002) * 0.7;
        targetHeadY = Math.sin(elapsed * 0.005) * 1.2;
      } else if (currentStat === 'listening') {
        if (!rig.isNodding && now >= rig.nextNodTime) {
          rig.isNodding = true;
          rig.nodStartTime = now;
        }

        if (rig.isNodding) {
          const nodProgress = (now - rig.nodStartTime) / 1200;
          if (nodProgress <= 1.0) {
            const nodWave = Math.sin(nodProgress * Math.PI * 2);
            targetPitch = nodWave * 2.4;
            targetHeadY = nodWave * 2.2;
            targetYaw = 0.5;
          } else {
            rig.isNodding = false;
            rig.nextNodTime = now + 3500 + Math.random() * 2000;
          }
        } else {
          targetPitch = 0.4;
          targetYaw = 0.6;
          targetHeadY = Math.sin(elapsed * 0.0018) * 0.6;
        }
      } else if (currentStat === 'thinking') {
        targetPitch = -1.2;
        targetYaw = 1.6;
        targetRoll = 1.4;
        targetHeadY = -1.5;
      } else {
        targetPitch = Math.sin(elapsed * 0.0015) * 0.6;
        targetHeadY = Math.sin(elapsed * 0.0015) * 1.0;
      }

      rig.currentPitch += (targetPitch - rig.currentPitch) * 0.08;
      rig.currentYaw += (targetYaw - rig.currentYaw) * 0.08;
      rig.currentRoll += (targetRoll - rig.currentRoll) * 0.08;
      rig.currentHeadY += (targetHeadY - rig.currentHeadY) * 0.08;

      if (stageRef.current) {
        // Tampilan portrait kokoh dan menyatu (tidak ada rotasi 3D miring / mengambang)
        stageRef.current.style.transform = `translateY(${rig.currentHeadY.toFixed(2)}px)`;
      }

      animIdRef.current = requestAnimationFrame(renderLoop);
    };

    animIdRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [is3DMode]);

  return (
    <div className={`ai-hrd-stage status-${effectiveStatus}`}>
      {/* Video Conference Card */}
      <div className={`hrd-video-card card-${effectiveStatus}`}>
        {/* Toggle Mode Avatar Button */}
        <button 
          className={`ai-mode-toggle-btn ${is3DMode ? 'btn-3d-active' : ''}`}
          onClick={() => setIs3DMode(prev => !prev)}
          title="Beralih antara Mode Avatar Realistis HD dan 3D Mesh Model"
        >
          {is3DMode ? (
            <>
              <Box size={14} />
              <span>Mode: 3D Mesh Model</span>
            </>
          ) : (
            <>
              <ImageIcon size={14} />
              <span>Avatar Realistis HD (Sesuai Foto)</span>
            </>
          )}
        </button>

        {/* Concentric Audio Wave Rings saat Alex berbicara */}
        {effectiveStatus === 'speaking' && (
          <div className="soundwave-rings-container" aria-hidden="true">
            <div className="soundwave-ring ring-1" />
            <div className="soundwave-ring ring-2" />
            <div className="soundwave-ring ring-3" />
          </div>
        )}

        {/* ===================================================================
            PILIHAN 1: REAL-TIME 3D MODEL AVATAR (DEFAULT)
            Menggunakan file GLB yang diunggah pengguna + 60 FPS Physics Anti-Kaku
           =================================================================== */}
        {is3DMode ? (
          <div className="ai-hrd-3d-stage">
            <AIHRD3D effectiveStatus={effectiveStatus} />
          </div>
        ) : (
          /* ===================================================================
             PILIHAN 2: 2D PROCEDURAL FACIAL RIG (FALLBACK)
             =================================================================== */
          <div className="avatar-media-wrapper">
            <div ref={stageRef} className="avatar-puppet-stage">
              <img 
                src={alexAvatarImg} 
                alt="Alex Rivera - HR Manager TechCorp" 
                className="hrd-avatar-image" 
              />
              <svg 
                className="avatar-facial-svg-overlay" 
                viewBox="0 0 1024 819" 
                preserveAspectRatio="xMidYMid slice"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="eyelidGradLeft" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dca188" />
                    <stop offset="70%" stopColor="#ebb29b" />
                    <stop offset="100%" stopColor="#b6715e" />
                  </linearGradient>
                  <linearGradient id="eyelidGradRight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dca188" />
                    <stop offset="70%" stopColor="#ebb29b" />
                    <stop offset="100%" stopColor="#b6715e" />
                  </linearGradient>
                  <radialGradient id="oralCavityGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#541b16" />
                    <stop offset="85%" stopColor="#280a08" />
                  </radialGradient>
                  <linearGradient id="lowerLipGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e58978" />
                    <stop offset="100%" stopColor="#ca6554" />
                  </linearGradient>
                </defs>

                <g ref={eyelidLeftRef} className="eyelid-vector-group" style={{ transformOrigin: '468px 356px' }}>
                  <path d="M 452 358 Q 468 348 484 358 Q 468 372 452 358 Z" fill="url(#eyelidGradLeft)" />
                  <path d="M 452 358 Q 468 352 484 358" stroke="#260e0a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                </g>

                <g ref={eyelidRightRef} className="eyelid-vector-group" style={{ transformOrigin: '538px 356px' }}>
                  <path d="M 522 358 Q 538 348 554 358 Q 538 372 522 358 Z" fill="url(#eyelidGradRight)" />
                  <path d="M 522 358 Q 538 352 554 358" stroke="#260e0a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                </g>

                <g ref={mouthVectorRef} className="mouth-vector-group" style={{ opacity: 0 }}>
                  <ellipse cx="499" cy="435" rx="24" ry="10" fill="url(#oralCavityGrad)" />
                  <path d="M 478 431 Q 499 429 520 431 Q 499 437 478 431 Z" fill="#f6efe9" />
                  <path d="M 488 440 Q 499 435 510 440 Q 499 443 488 440 Z" fill="#c05f52" />
                  <path d="M 472 432 Q 499 446 526 432 Q 499 443 472 432 Z" fill="url(#lowerLipGrad)" />
                </g>
              </svg>
            </div>
            <div className="avatar-vignette-overlay" />
          </div>
        )}

        {/* Top-Left: AI Status & Feedback */}
        <div className="ai-status-badge">
          {effectiveStatus === 'speaking' && (
            <>
              <span className="status-dot dot-speaking" />
              <span>Alex berbicara ({is3DMode ? '3D Live Speech' : 'Lip-Sync'})</span>
              <div className="mini-audio-bars">
                <span className="mini-bar" />
                <span className="mini-bar" />
                <span className="mini-bar" />
                <span className="mini-bar" />
              </div>
            </>
          )}

          {effectiveStatus === 'thinking' && (
            <>
              <span className="status-dot dot-thinking" />
              <BrainCircuit size={13} />
              <span>Alex menganalisis jawaban...</span>
            </>
          )}

          {effectiveStatus === 'listening' && (
            <>
              <span className="status-dot dot-listening" />
              <Mic size={13} />
              <span>Alex menyimak (Mengangguk)</span>
            </>
          )}

          {effectiveStatus === 'idle' && (
            <>
              <span className="status-dot dot-online" />
              <span>Alex Rivera • Siap Wawancara</span>
            </>
          )}
        </div>

        {/* Bottom-Left: Name & Role Card */}
        <div className="ai-name-card">
          <img 
            src={alexAvatarImg} 
            alt="Alex Rivera Mini" 
            className="ai-name-avatar-thumb" 
          />
          <div className="ai-name-details">
            <div className="ai-name-title">
              Alex Rivera
              <CheckCircle2 size={14} className="ai-verified-icon" />
            </div>
            <div className="ai-name-subtitle">
              HR Manager
              <span className="ai-company-pill">TechCorp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
