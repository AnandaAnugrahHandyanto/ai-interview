import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * 3D Model Character Alex Rivera (TechCorp HR Manager)
 * Menggunakan Photorealistic Color Texture berdasar Foto Referensi Resmi
 * Dilengkapi 4 GPU Morph Targets:
 * - Target 0: Mulut berbicara dinamis (Artikulasi suku kata)
 * - Target 1: Kedipan mata biologis alami
 * - Target 2: Alis ekspresif (Pertanyaan / Analisis)
 * - Target 3: Senyum hangat profesional saat menyimak kandidat
 */
function HRDModel({ effectiveStatus }) {
  const modelRef = useRef(null);
  const gltf = useGLTF('/alex_hrd.glb');

  // Rig timer untuk kedipan mata alami
  const rig = useRef({
    nextBlinkTime: 3.0,
    isBlinking: false,
    blinkStartTime: 0,
    blinkDuration: 0.18,
    hasDoubleBlinked: false
  });

  // Konfigurasi Geometri: Photorealistic Colors + 4 Morph Targets
  const preparedScene = useMemo(() => {
    const cloned = gltf.scene.clone(true);

    cloned.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const geo = child.geometry.clone();
        geo.computeVertexNormals();

        const count = geo.attributes.position.count;
        const pos = geo.attributes.position;

        // Buffer array untuk 4 morph targets
        const mouthPos = new Float32Array(count * 3);
        const blinkPos = new Float32Array(count * 3);
        const browPos = new Float32Array(count * 3);
        const smilePos = new Float32Array(count * 3);

        // Buffer array untuk warna palet resmi referensi (bebas bercak/leleh)
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const z = pos.getZ(i);

          // Salin posisi dasar
          mouthPos[i * 3] = x;
          mouthPos[i * 3 + 1] = y;
          mouthPos[i * 3 + 2] = z;

          blinkPos[i * 3] = x;
          blinkPos[i * 3 + 1] = y;
          blinkPos[i * 3 + 2] = z;

          browPos[i * 3] = x;
          browPos[i * 3 + 1] = y;
          browPos[i * 3 + 2] = z;

          smilePos[i * 3] = x;
          smilePos[i * 3 + 1] = y;
          smilePos[i * 3 + 2] = z;

          // Target 0: Mulut Berbicara Alami (Subtle & Luwes - Tidak Robek/Bolong)
          if (y >= 0.575 && y <= 0.635 && Math.abs(x) < 0.048 && z > -0.06) {
            if (y < 0.612) {
              mouthPos[i * 3 + 1] = y - 0.010;
              mouthPos[i * 3 + 2] = z - 0.003;
            } else {
              mouthPos[i * 3 + 1] = y + 0.003;
            }

            // Target 3: Senyum Hangat (Sudut bibir naik & melebar)
            if (Math.abs(x) > 0.025) {
              smilePos[i * 3 + 1] = y + 0.006;
              smilePos[i * 3] = x > 0 ? x + 0.004 : x - 0.004;
            }
          }

          // Target 1: Kedipan Mata Biologis (Kelopak atas turun)
          if (y >= 0.68 && y <= 0.735 && Math.abs(x) >= 0.025 && Math.abs(x) <= 0.075 && z > -0.055) {
            if (y >= 0.705) {
              blinkPos[i * 3 + 1] = y - 0.018;
            }
          }

          // Target 2: Alis Ekspresif (Terangkat saat bertanya / berpikir)
          if (y >= 0.74 && y <= 0.785 && Math.abs(x) >= 0.02 && Math.abs(x) <= 0.085 && z > -0.055) {
            browPos[i * 3 + 1] = y + 0.014;
          }

          // ===================================================================
          // PENETAPAN WARNA PALET BERDASARKAN FOTO REFERENSI RESMI ALEX RIVERA
          // ===================================================================
          let r = 0.09, g = 0.13, b = 0.24; // Default jas navy eksekutif

          if (y > 0.76 || (y > 0.64 && (z < -0.03 || Math.abs(x) > 0.095))) {
            // Rambut cokelat tua bervolume (#2b1d16)
            r = 0.17; g = 0.11; b = 0.09;
          } else if (y >= 0.735 && y <= 0.775 && Math.abs(x) >= 0.02 && Math.abs(x) <= 0.085 && z > -0.045) {
            // Alis mata natural (#1e140f)
            r = 0.12; g = 0.08; b = 0.06;
          } else if (y >= 0.67 && y <= 0.73 && Math.abs(x) >= 0.015 && Math.abs(x) <= 0.092 && z > -0.022) {
            // Kacamata modern charcoal (#141416)
            r = 0.08; g = 0.08; b = 0.09;
          } else if (y >= 0.575 && y <= 0.635 && Math.abs(x) < 0.045 && z > -0.045) {
            // Bibir & gigi senyum hangat
            if (y < 0.608 && y > 0.585 && Math.abs(x) < 0.025 && z < -0.018) {
              r = 0.96; g = 0.96; b = 0.96; // Gigi putih bersih
            } else {
              r = 0.78; g = 0.42; b = 0.35; // Bibir sehat natural (#c86a58)
            }
          } else if (y >= 0.38) {
            // Kulit wajah & leher warm peach-tan (#ebb097)
            if (y >= 0.61 && y <= 0.68 && Math.abs(x) >= 0.045 && Math.abs(x) <= 0.08) {
              r = 0.91; g = 0.61; b = 0.51; // Pipi segar merona
            } else {
              r = 0.92; g = 0.69; b = 0.59; // Kulit warm natural
            }
          } else if (y >= 0.22 && y <= 0.38 && Math.abs(x) <= 0.065 && z > -0.025) {
            // Kerah kemeja putih rapi (#f8fafc)
            r = 0.97; g = 0.98; b = 0.99;
          } else if (y >= -0.05 && y <= 0.32 && Math.abs(x) <= 0.038 && z > -0.018) {
            // Dasi royal blue (#1e3a8a)
            r = 0.12; g = 0.23; b = 0.54;
          } else {
            // Jas tailored dark navy (#18223c)
            r = 0.09; g = 0.13; b = 0.24;
          }

          colors[i * 3] = r;
          colors[i * 3 + 1] = g;
          colors[i * 3 + 2] = b;
        }

        // Terapkan Palet Warna & 4 Morph Targets ke Geometri
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.morphAttributes.position = [
          new THREE.BufferAttribute(mouthPos, 3),  // Target 0: Mulut Bicara
          new THREE.BufferAttribute(blinkPos, 3),  // Target 1: Kedipan Mata
          new THREE.BufferAttribute(browPos, 3),   // Target 2: Alis Ekspresif
          new THREE.BufferAttribute(smilePos, 3)   // Target 3: Senyum Hangat
        ];

        child.geometry = geo;
        child.updateMorphTargets();

        // Material Kulit & Busana Organik Photorealistic Sesuai Referensi
        child.material = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.42,
          metalness: 0.04,
          flatShading: false
        });

        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return cloned;
  }, [gltf]);

  const baseY = -0.58;

  // 60 FPS Procedural Facial & Head Engine (Mulut, Mata, Alis, & Gestur Kepala Anti-Kaku)
  useFrame((state) => {
    if (!modelRef.current) return;
    const time = state.clock.getElapsedTime();
    const mesh = modelRef.current.getObjectByProperty('isMesh', true);

    // =========================================================================
    // 1. GERAKAN MULUT 3D REAL-TIME (Morph Target 0)
    // =========================================================================
    let targetMouth = 0;
    if (effectiveStatus === 'speaking') {
      // Artikulasi kata vokal & konsonan multi-frekuensi yang luwes
      const wave1 = Math.sin(time * 11.0);
      const wave2 = Math.sin(time * 22.0);
      const wave3 = Math.sin(time * 5.0);
      targetMouth = Math.max(0.08, (wave1 * 0.45 + wave2 * 0.25 + 0.4) * (0.8 + wave3 * 0.2));
    } else {
      targetMouth = 0.0;
    }

    if (mesh && mesh.morphTargetInfluences) {
      mesh.morphTargetInfluences[0] = THREE.MathUtils.lerp(
        mesh.morphTargetInfluences[0] || 0,
        targetMouth,
        0.22
      );
    }

    // =========================================================================
    // 2. KEDIPAN MATA ALAMI 3D (Morph Target 1)
    // =========================================================================
    if (!rig.current.isBlinking && time >= rig.current.nextBlinkTime) {
      rig.current.isBlinking = true;
      rig.current.blinkStartTime = time;
      rig.current.blinkDuration = 0.18 + Math.random() * 0.05;
    }

    let targetBlink = 0;
    if (rig.current.isBlinking) {
      const progress = (time - rig.current.blinkStartTime) / rig.current.blinkDuration;
      if (progress <= 0.4) {
        targetBlink = progress / 0.4;
      } else if (progress <= 0.55) {
        targetBlink = 1.0;
      } else if (progress <= 1.0) {
        targetBlink = 1.0 - (progress - 0.55) / 0.45;
      } else {
        rig.current.isBlinking = false;
        if (!rig.current.hasDoubleBlinked && Math.random() < 0.25) {
          rig.current.hasDoubleBlinked = true;
          rig.current.nextBlinkTime = time + 0.14; // Double-blink alami
        } else {
          rig.current.hasDoubleBlinked = false;
          rig.current.nextBlinkTime = time + 2.8 + Math.random() * 2.6;
        }
      }
    }

    if (mesh && mesh.morphTargetInfluences) {
      mesh.morphTargetInfluences[1] = THREE.MathUtils.lerp(
        mesh.morphTargetInfluences[1] || 0,
        targetBlink,
        0.35
      );
    }

    // =========================================================================
    // 3. EKSPRESI ALIS & SENYUM 3D (Morph Target 2 & 3)
    // =========================================================================
    let targetBrow = 0;
    let targetSmile = 0;

    if (effectiveStatus === 'speaking') {
      targetBrow = Math.max(0, Math.sin(time * 3.5) * 0.4 + 0.2); // Alis terangkat saat bertanya
      targetSmile = 0.3;
    } else if (effectiveStatus === 'listening') {
      targetBrow = 0.15;
      targetSmile = 0.7; // Senyum ramah hangat saat menyimak kandidat
    } else if (effectiveStatus === 'thinking') {
      targetBrow = 0.55; // Alis terangkat menganalisis
      targetSmile = 0.1;
    } else {
      targetBrow = 0.05;
      targetSmile = 0.35; // Senyum santai profesional
    }

    if (mesh && mesh.morphTargetInfluences) {
      if (mesh.morphTargetInfluences[2] !== undefined) {
        mesh.morphTargetInfluences[2] = THREE.MathUtils.lerp(mesh.morphTargetInfluences[2], targetBrow, 0.12);
      }
      if (mesh.morphTargetInfluences[3] !== undefined) {
        mesh.morphTargetInfluences[3] = THREE.MathUtils.lerp(mesh.morphTargetInfluences[3], targetSmile, 0.12);
      }
    }

    // =========================================================================
    // 4. GESTUR KEPALA & TUBUH 3D LUWES (Anti-Kaku)
    // =========================================================================
    const breath = Math.sin(time * 1.5);
    const breathY = breath * 0.005;

    // Mouse tracking halus untuk kontak mata
    const mouseX = state.pointer.x * 0.05;
    const mouseY = state.pointer.y * 0.035;

    let targetRotX = -mouseY;
    let targetRotY = mouseX;
    let targetRotZ = 0;
    let targetPosZ = 0;

    if (effectiveStatus === 'speaking') {
      targetRotX += Math.sin(time * 4.2) * 0.032 + Math.sin(time * 8.0) * 0.016;
      targetRotY += Math.cos(time * 3.2) * 0.028;
      targetRotZ += Math.sin(time * 2.5) * 0.014;
      targetPosZ += Math.sin(time * 2.0) * 0.012;
    } else if (effectiveStatus === 'listening') {
      const nodCycle = (time % 3.6) / 3.6;
      if (nodCycle < 0.28) {
        targetRotX += Math.sin((nodCycle / 0.28) * Math.PI) * 0.06; // Mengangguk menyimak
      }
      targetRotZ += 0.02;
    } else if (effectiveStatus === 'thinking') {
      targetRotX += -0.035;
      targetRotZ += 0.05;
      targetRotY += 0.035;
    } else {
      targetRotX += Math.sin(time * 0.8) * 0.01;
      targetRotY += Math.cos(time * 0.6) * 0.012;
    }

    modelRef.current.rotation.x = THREE.MathUtils.lerp(modelRef.current.rotation.x, targetRotX, 0.08);
    modelRef.current.rotation.y = THREE.MathUtils.lerp(modelRef.current.rotation.y, targetRotY, 0.08);
    modelRef.current.rotation.z = THREE.MathUtils.lerp(modelRef.current.rotation.z, targetRotZ, 0.08);

    modelRef.current.position.y = THREE.MathUtils.lerp(modelRef.current.position.y, baseY + breathY, 0.1);
    modelRef.current.position.z = THREE.MathUtils.lerp(modelRef.current.position.z, targetPosZ, 0.08);
  });

  return (
    <primitive 
      ref={modelRef} 
      object={preparedScene} 
      position={[0, baseY, 0]} 
    />
  );
}

useGLTF.preload('/alex_hrd.glb');

/**
 * Stage Studio 3D dengan Pencahayaan Hangat Natural Selaras dengan Kantor Eksekutif
 */
export default function AIHRD3D({ effectiveStatus = 'idle' }) {
  return (
    <div className="ai-hrd-3d-canvas-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0.04, 1.42], fov: 35 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        {/* Ambient Room Lighting */}
        <ambientLight intensity={1.05} color="#f8fafc" />
        
        {/* Pencahayaan Alami dari Jendela Gedung Sebelah Kiri */}
        <directionalLight 
          position={[-3.0, 2.0, 2.0]} 
          intensity={1.4} 
          color="#e0f2fe" 
        />
        
        {/* Key Light Studio Hangat dari Depan Kanan */}
        <directionalLight 
          position={[2.5, 3.0, 2.5]} 
          intensity={1.6} 
          color="#fff7ed" 
          castShadow 
        />
        
        {/* Rim Light Lembut untuk Siluet Bahu & Rambut */}
        <directionalLight 
          position={[0, 2.5, -2.5]} 
          intensity={effectiveStatus === 'speaking' ? 2.0 : 1.3} 
          color={effectiveStatus === 'speaking' ? '#818cf8' : '#60a5fa'} 
        />

        {/* Soft Point Light di Depan Wajah untuk Menjaga Warna Kulit & Kacamata Tetap Terang */}
        <pointLight 
          position={[0, 0.6, 1.2]} 
          intensity={0.5} 
          color="#fff1e6" 
        />

        <Suspense fallback={null}>
          <HRDModel effectiveStatus={effectiveStatus} />
        </Suspense>

        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2.2}
          maxPolarAngle={Math.PI / 1.8}
          minAzimuthAngle={-Math.PI / 8}
          maxAzimuthAngle={Math.PI / 8}
          rotateSpeed={0.4}
        />
      </Canvas>
    </div>
  );
}