# YOUMAINの3Dルーム実装コード

## メインコンポーネント (ThreeDRoom/index.tsx)
```typescript
'use client'

import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/use-profile";
import { useUser } from "@/hooks/use-user";
import Scene from './components/Scene';
import { Shop } from './components/Shop';
import FixedMenu from './components/FixedMenu';
import { RoomItemsList } from './components/PurchasedItemsList';
import { WarehouseItemsList } from './components/WarehouseItemsList';

export default function ThreeDRoom() {
  const { toast } = useToast();
  const { profile } = useProfile();
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isWarehouse, setIsWarehouse] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showWarehouseList, setShowWarehouseList] = useState(false);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);

  const handleScreenshot = useCallback(async (dataUrl: string) => {
    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      toast({
        title: "成功",
        description: "プロフィール画像を更新しました",
      });
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message || "プロフィール画像の更新に失敗しました",
        variant: "destructive"
      });
    } finally {
      setIsScreenshotMode(false);
    }
  }, [toast]);

  const handleScreenshotMode = useCallback(() => {
    if (!user || user.userType !== 'fan') {
      toast({
        title: "エラー",
        description: "ファンユーザーのみがプロフィール画像を設定できます",
        variant: "destructive"
      });
      return;
    }
    setIsScreenshotMode(true);
  }, [user, toast]);

  return (
    <div className="w-full h-screen relative">
      <Canvas
        shadows
        camera={{
          position: [0.45, 26.44, 26.91],
          fov: 45
        }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Scene
          items={items}
          isWarehouse={isWarehouse}
          onModelClick={setSelectedModel}
          onScreenshot={handleScreenshot}
          isScreenshotMode={isScreenshotMode}
        />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={40}
          enableZoom={true}
          enableRotate={true}
          enablePan={true}
        />
        <Environment preset="city" />
      </Canvas>

      <FixedMenu
        onWarehouseClick={() => setShowWarehouseList(!showWarehouseList)}
        isWarehouse={showWarehouseList}
        onShopClick={() => setShowShop(true)}
        onSaveLayout={() => {}}
        onResetLayout={() => {}}
        onScreenshotMode={handleScreenshotMode}
      />

      {showShop && (
        <Shop
          onClose={() => setShowShop(false)}
          onTryPlacement={() => {}}
        />
      )}

      {showWarehouseList && (
        <WarehouseItemsList
          items={[]}
          onClose={() => setShowWarehouseList(false)}
          onMoveToRoom={() => {}}
          onDeleteItem={() => {}}
        />
      )}
    </div>
  );
}
```

## シーンコンポーネント (Scene.tsx)
```typescript
import { Suspense, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import type { CollectionItem } from '@/types/room';

interface ModelProps {
  item: CollectionItem;
  onModelClick: (id: string) => void;
}

function Model({ item, onModelClick }: ModelProps) {
  const { scene } = useGLTF(item.modelUrl);

  useEffect(() => {
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene]);

  return (
    <primitive
      object={scene.clone()}
      position={[item.position.x, item.position.y, item.position.z]}
      rotation={[0, item.rotation, 0]}
      scale={[item.scale, item.scale, item.scale]}
      onClick={(e: any) => {
        e.stopPropagation();
        onModelClick(item.id);
      }}
    />
  );
}

interface SceneProps {
  items: CollectionItem[];
  isWarehouse: boolean;
  onModelClick: (id: string) => void;
  onScreenshot?: (dataUrl: string) => void;
  isScreenshotMode?: boolean;
}

export default function Scene({ items, isWarehouse, onModelClick, onScreenshot, isScreenshotMode }: SceneProps) {
  useEffect(() => {
    if (isScreenshotMode && onScreenshot) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        onScreenshot(dataUrl);
      }
    }
  }, [isScreenshotMode, onScreenshot]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        castShadow
        position={[5, 8, 5]}
        intensity={1}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <mesh 
        receiveShadow 
        position={[0, -0.25, 0]}
      >
        <boxGeometry args={[20, 0.5, 20]} />
        <meshStandardMaterial color="#a0a0a0" />
      </mesh>

      <mesh
        receiveShadow
        position={[0, 5, -10]}
      >
        <boxGeometry args={[20, 10, 0.5]} />
        <meshStandardMaterial color="#e8d5c4" />
      </mesh>

      <mesh
        receiveShadow
        position={[10, 5, 0]}
      >
        <boxGeometry args={[0.5, 10, 20]} />
        <meshStandardMaterial color="#e2cbb5" />
      </mesh>

      <mesh
        receiveShadow
        position={[-10, 5, 0]}
      >
        <boxGeometry args={[0.5, 10, 20]} />
        <meshStandardMaterial color="#e2cbb5" />
      </mesh>

      <Suspense fallback={null}>
        {items.map((item) => (
          <Model
            key={item.id}
            item={item}
            onModelClick={onModelClick}
          />
        ))}
      </Suspense>
    </>
  );
}
```

## 移動コントロールコンポーネント (MovementControls.tsx)
```typescript
interface MovementControlsProps {
  model: CollectionItem | undefined;
  displayName: string;
  updateModelPosition: (id: string, newPosition: { x: number; z: number }) => void;
  updateModelHeight: (id: string, newHeight: number) => void;
  updateModelRotation: (id: string, newRotation: number) => void;
  updateModelScale: (id: string, newScale: number) => void;
  onClose: () => void;
  onPurchase: () => void;
  onCancelPurchase: () => void;
  onMoveToWarehouse?: (id: string) => void;
}

export function MovementControls({
  model,
  displayName,
  updateModelPosition,
  updateModelHeight,
  updateModelRotation,
  updateModelScale,
  onClose,
  onPurchase,
  onCancelPurchase,
  onMoveToWarehouse,
}: MovementControlsProps) {
  if (!model) return null;

  const moveStep = 0.5;
  const rotateStep = Math.PI / 8;
  const scaleStep = 0.1;

  return (
    <Card className="absolute right-4 bottom-20 w-64">
      <CardContent className="p-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold">{displayName}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {model.isPurchased && onMoveToWarehouse && (
            <Button
              size="sm"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => onMoveToWarehouse(model.id)}
            >
              <Archive className="h-4 w-4" />
              倉庫へ移動
            </Button>
          )}

          <div className="grid grid-cols-2 gap-1">
            <Button size="sm" onClick={() => updateModelPosition(model.id, { x: model.position.x - moveStep, z: model.position.z })}>
              左へ
            </Button>
            <Button size="sm" onClick={() => updateModelPosition(model.id, { x: model.position.x + moveStep, z: model.position.z })}>
              右へ
            </Button>
            <Button size="sm" onClick={() => updateModelPosition(model.id, { x: model.position.x, z: model.position.z + moveStep })}>
              前へ
            </Button>
            <Button size="sm" onClick={() => updateModelPosition(model.id, { x: model.position.x, z: model.position.z - moveStep })}>
              後ろへ
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <Button size="sm" onClick={() => updateModelHeight(model.id, model.position.y - 0.1)}>
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => updateModelHeight(model.id, model.position.y + 0.1)}>
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <Button size="sm" onClick={() => updateModelRotation(model.id, model.rotation + rotateStep)}>
              <RotateCw className="h-4 w-4 -scale-x-100" />
            </Button>
            <Button size="sm" onClick={() => updateModelRotation(model.id, model.rotation - rotateStep)}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          {!model.isPurchased && (
            <>
              <div className="grid grid-cols-2 gap-1">
                <Button size="sm" onClick={() => updateModelScale(model.id, model.scale - scaleStep)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => updateModelScale(model.id, model.scale + scaleStep)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-yellow-600">※購入後は大きさの変更ができません</p>
            </>
          )}

          {!model.isPurchased && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={onCancelPurchase}
              >
                キャンセル
              </Button>
              <Button size="sm" className="flex-1 text-xs" onClick={onPurchase}>
                購入する
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

## 固定メニューコンポーネント (FixedMenu.tsx)
```typescript
interface FixedMenuProps {
  onWarehouseClick: () => void;
  isWarehouse: boolean;
  onShopClick: () => void;
  onSaveLayout: () => void;
  onResetLayout: () => void;
  onScreenshotMode: () => void;
}

export default function FixedMenu({
  onWarehouseClick,
  isWarehouse,
  onShopClick,
  onSaveLayout,
  onResetLayout,
  onScreenshotMode,
}: FixedMenuProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg">
      <Button
        variant={isWarehouse ? "default" : "outline"}
        size="icon"
        onClick={onWarehouseClick}
        title={isWarehouse ? "部屋に戻る" : "倉庫へ移動"}
      >
        <Home className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onShopClick}
        title="ショップを開く"
      >
        <ShoppingBag className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onSaveLayout}
        title="配置を保存"
      >
        <Save className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onResetLayout}
        title="配置をリセット"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onScreenshotMode}
        title="スクリーンショットモード"
      >
        <Camera className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

## データ型定義
```typescript
// types/room.ts
export interface CollectionItem {
  id: string;
  name: string;
  modelUrl: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: number;
  scale: number;
  isPurchased: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  imageUrl: string;
  modelUrl: string;
  price: number;
  defaultScale: number;
}
```
