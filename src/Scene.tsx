import {
  Edges,
  GradientTexture,
  MeshDistortMaterial,
  OrbitControls,
  useTexture,
  SpotLight,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { a, SpringValue, useSpring, useSprings } from "@react-spring/three";
import { AdditiveBlending, Vector3 } from "three";
import {
  COLORED_BG_COLORS,
  COLORS,
  DARK_BG_COLORS,
  DARK_COLORS,
  DARK_GRAY_COLORS,
  GRAY_COLORS,
  LIGHT_BG_COLORS,
  LIGHT_COLORS,
  LIGHT_GRAY_COLORS,
} from "./constants";
import {
  getSizeByAspect,
  pickRandom,
  pickRandomBoolean,
  pickRandomColorWithTheme,
  pickRandomDecimalFromInterval,
  pickRandomIntFromInterval,
  range,
} from "./utils";
import Spikes from "./Spikes";
import Grooves from "./Grooves";
import Points from "./Points";
import StripeBackground from "./StripeBackground";
import { isMobile, isMobileSafari } from "react-device-detect";

const cameraPosition = new Vector3(
  pickRandomDecimalFromInterval(-15, 15),
  pickRandomDecimalFromInterval(-15, 15),
  0
);

enum BgType {
  "Dark" = 0,
  "Light" = 1,
  "Colored" = 2,
}
const bgType = pickRandom([
  ...new Array(15).fill(null).map(() => 0),
  1,
  ...new Array(3).fill(null).map(() => 2),
]);

enum MasterAmplificationType {
  "Default" = 0,
  "EmptySides" = 1,
  "Grooves" = 2,
  "DarkLitStrobes" = 3,
  "TertiaryQuaternarySides" = 4,
}
const masterType: MasterAmplificationType = pickRandom([
  ...new Array(40).fill(null).map(() => 0),
  ...new Array(2).fill(null).map(() => 1),
  ...new Array(5).fill(null).map(() => 2),
  ...new Array(2).fill(null).map(() => (bgType === BgType.Light ? 0 : 3)),
  ...new Array(5).fill(null).map(() => 4),
]);

const bgColor =
  bgType === BgType.Light
    ? pickRandom(LIGHT_BG_COLORS)
    : bgType === BgType.Colored
    ? pickRandom(COLORED_BG_COLORS)
    : pickRandom(DARK_BG_COLORS);
const primaryColor =
  bgType === BgType.Light ? pickRandom(DARK_COLORS) : pickRandom(LIGHT_COLORS);
const secondaryColor =
  bgType === BgType.Light ? pickRandom(DARK_COLORS) : pickRandom(LIGHT_COLORS);
const hasGradient = pickRandomBoolean();
const hasTexture = pickRandom([
  ...new Array(24).fill(null).map(() => false),
  true,
]);
const hasFog =
  bgType === BgType.Light
    ? false
    : pickRandom([...new Array(14).fill(null).map(() => false), true]);
const fogColor = pickRandom([bgColor, primaryColor]);
const hasColoredStroke = pickRandom([
  ...new Array(9).fill(null).map(() => false),
  true,
]);
const hasMixedColors = pickRandom([
  ...new Array(9).fill(null).map(() => false),
  true,
]);
const hasStripeBackground = pickRandom([
  ...new Array(bgType === BgType.Light ? 4 : 9).fill(null).map(() => false),
  true,
]);
const hasPointsBackground = hasStripeBackground
  ? false
  : pickRandom([
      ...new Array(bgType === BgType.Light ? 2 : 4).fill(null).map(() => false),
      true,
    ]);
console.log("bgType", bgType);
console.log("masterType", masterType);
console.log("hasFog", hasFog);
console.log("hasStripeBackground", hasStripeBackground);
console.log("hasPointsBackground", hasPointsBackground);
export enum PointsBackgroundType {
  "Points" = 0,
  "Lines" = 1,
}
const pointsBackgroundType: PointsBackgroundType = pickRandom([0, 0, 1]);

const sides = new Array(12).fill(null).map((_, i) => i * (Math.PI / 6));
const primarySideCount =
  masterType === MasterAmplificationType.TertiaryQuaternarySides
    ? pickRandom([2, 3])
    : pickRandom([2, 3, 4, 5, 6]);
const secondarySideCount =
  masterType === MasterAmplificationType.TertiaryQuaternarySides
    ? pickRandom([1])
    : pickRandom([1, 2, 3]);
const tertiarySideCount =
  masterType === MasterAmplificationType.TertiaryQuaternarySides
    ? pickRandom([4, 5, 6])
    : pickRandom([1, 2]);
const quaternarySideCount =
  masterType === MasterAmplificationType.TertiaryQuaternarySides
    ? pickRandom([4, 5, 6])
    : pickRandom([1, 2]);
const primaryLengths = [0, 0, 1 * (Math.PI / 6), 2 * (Math.PI / 6)];
const secondarylengths = [
  0,
  1 * (Math.PI / 6),
  2 * (Math.PI / 6),
  3 * (Math.PI / 6),
];
enum RingSectionTypes {
  "Empty" = 0,
  "Filled" = 1,
  "Textured" = 2,
}
const ringSectionTypes: RingSectionTypes[] =
  bgType === BgType.Light
    ? masterType === MasterAmplificationType.EmptySides ||
      masterType === MasterAmplificationType.Grooves
      ? [...new Array(3).fill(null).map(() => 0), 1]
      : hasTexture
      ? [0, 2, 2, 2]
      : [0, 1, 1, 1]
    : masterType === MasterAmplificationType.EmptySides ||
      masterType === MasterAmplificationType.Grooves
    ? [...new Array(9).fill(null).map(() => 0), 1]
    : hasTexture
    ? [0, 2, 2, 2]
    : [0, 1];

const getSides = (count: number, sideArray: number[]) =>
  new Array(count).fill(null).reduce<number[]>((array) => {
    if (!array.length) {
      array = [pickRandom(sideArray)];
      return array;
    }

    const availableSides = sideArray.filter(
      (side) => !array.find((o) => side === o)
    );

    array.push(pickRandom(availableSides));
    return array;
  }, []);

enum RingSectionAltStart {
  "Default" = 0,
  "DoubleSpiral" = 1,
  "SingleSpiral" = 2,
}
const ringAltStart = pickRandom([0, 0, 0, 1, 2]);
enum RingSectionAltLength {
  "Default" = 0,
  "Irregular" = 1,
  "Flat" = 2,
}
const ringAltLength = pickRandom([0, 0, 0, 1, 2]);

interface RingSectionData {
  thetaStart: number;
  length: number;
  type: number;
  color: string;
  strokeColor: string;
  opacity: number;
  texture: number;
}

const coloredPrimaryStroke =
  bgType === BgType.Light ? pickRandom(DARK_COLORS) : pickRandom(COLORS);
const primaryRingSides = getSides(primarySideCount, sides).map(
  (thetaStart) => ({
    ringSections: new Array(36).fill(null).map((_, i) => {
      const color = hasMixedColors
        ? pickRandom(COLORS)
        : pickRandomColorWithTheme(primaryColor, COLORS, COLORS.length * 10);

      const type = pickRandom(ringSectionTypes);
      const strokeColor = hasColoredStroke
        ? coloredPrimaryStroke
        : bgType === BgType.Light
        ? pickRandom(DARK_GRAY_COLORS)
        : pickRandom(GRAY_COLORS);
      const length = pickRandom([
        pickRandom(primaryLengths),
        pickRandom(primaryLengths) * (i / 10),
      ]);
      const texture = pickRandom([0, 1, 2]);

      return {
        thetaStart,
        length,
        type,
        color,
        opacity: 1,
        strokeColor,
        texture,
      };
    }),
  })
);

const coloredSecondaryStroke =
  bgType === BgType.Light ? pickRandom(DARK_COLORS) : pickRandom(COLORS);
const secondaryRingSides = getSides(secondarySideCount, sides).map(
  (thetaStart) => ({
    ringSections: new Array(18).fill(null).map((_, i) => {
      const color = hasMixedColors
        ? pickRandom(COLORS)
        : pickRandomColorWithTheme(primaryColor, COLORS, COLORS.length * 10);

      const type = pickRandom(ringSectionTypes);
      const strokeColor = hasColoredStroke
        ? coloredSecondaryStroke
        : bgType === BgType.Light
        ? pickRandom(DARK_GRAY_COLORS)
        : pickRandom(GRAY_COLORS);
      const length = pickRandom([
        pickRandom(primaryLengths),
        pickRandom(primaryLengths) * (i / 10),
      ]);
      const texture = pickRandom([0, 1, 2]);

      return {
        thetaStart,
        length,
        type,
        color,
        opacity: 1,
        strokeColor,
        texture,
      };
    }),
  })
);

const coloredTertiaryStroke =
  bgType === BgType.Light ? pickRandom(DARK_COLORS) : pickRandom(COLORS);
const tertiaryRingSides = getSides(tertiarySideCount, sides).map(
  (thetaStart) => ({
    ringSections: new Array(9).fill(null).map((_, i) => {
      const color = hasMixedColors
        ? pickRandom(COLORS)
        : pickRandomColorWithTheme(primaryColor, COLORS, COLORS.length * 10);

      const type = pickRandom(ringSectionTypes);
      const strokeColor = hasColoredStroke
        ? coloredTertiaryStroke
        : bgType === BgType.Light
        ? pickRandom(DARK_GRAY_COLORS)
        : pickRandom(GRAY_COLORS);
      const length = pickRandom([
        ...new Array(81)
          .fill(null)
          .map(() =>
            pickRandom([
              pickRandom(secondarylengths),
              pickRandom(secondarylengths) * (i / 5),
            ])
          ),
        Math.PI * 2,
      ]);
      const texture = pickRandom([0, 1, 2]);

      return {
        thetaStart,
        length,
        type,
        color,
        opacity: length === Math.PI * 2 ? pickRandom([0.8, 1]) : 1,
        strokeColor,
        texture,
      };
    }),
  })
);

const coloredQuaternaryStroke =
  bgType === BgType.Light ? pickRandom(DARK_COLORS) : pickRandom(COLORS);
const quaternaryRingSides = getSides(quaternarySideCount, sides).map(
  (thetaStart) => ({
    ringSections: new Array(4).fill(null).map((_, i) => {
      const color = hasMixedColors
        ? pickRandom(COLORS)
        : pickRandomColorWithTheme(primaryColor, COLORS, COLORS.length * 10);

      const type = pickRandom(ringSectionTypes);
      const strokeColor = hasColoredStroke
        ? coloredQuaternaryStroke
        : bgType === BgType.Light
        ? pickRandom(DARK_GRAY_COLORS)
        : pickRandom(GRAY_COLORS);
      const length = pickRandom([
        ...new Array(36)
          .fill(null)
          .map(() =>
            pickRandom([
              pickRandom(secondarylengths),
              pickRandom(secondarylengths) * (i / 2),
            ])
          ),
        Math.PI * 2,
      ]);
      const texture = pickRandom([0, 1, 2]);

      return {
        thetaStart,
        length,
        opacity: length === Math.PI * 2 ? pickRandom([0.8, 1]) : 1,
        type,
        color,
        strokeColor,
        texture,
      };
    }),
  })
);

const remainingSides = sides.filter(
  (side) =>
    ![
      ...primaryRingSides,
      ...secondaryRingSides,
      ...tertiaryRingSides,
      ...quaternaryRingSides,
    ].find((o) => o.ringSections[0].thetaStart === side)
);

/****************************************************** */

const spikesCount =
  masterType === MasterAmplificationType.EmptySides
    ? pickRandom([3, 4, 5])
    : pickRandom([1, 2, 3]);
const spikes = new Array(spikesCount).fill(null).map(() => {
  const thetaStart = pickRandom([
    pickRandom(sides),
    pickRandom(remainingSides),
  ]);
  const gap = pickRandomDecimalFromInterval(0.01, 0.05);
  const count = pickRandomIntFromInterval(6, 18);
  const color = pickRandom([0, 1]);
  const solidColor = pickRandom(COLORS);

  return {
    spikes: new Array(count).fill(null).map(() => ({
      thetaStart,
      depth: pickRandomDecimalFromInterval(5, 30),
      color: color === 0 ? pickRandom(LIGHT_GRAY_COLORS) : solidColor,
      gap,
    })),
  };
});

/****************************************************** */

const groovesCount =
  masterType === MasterAmplificationType.Grooves
    ? pickRandom([10, 11, 12])
    : pickRandom([1, 2, 3]);
const groovesSides =
  masterType === MasterAmplificationType.Grooves
    ? getSides(groovesCount, sides)
    : getSides(groovesCount, remainingSides);
const grooves = new Array(groovesCount).fill(null).map((_, outerIndex) => {
  const radius = pickRandomDecimalFromInterval(0.4, 1.6);
  const width = pickRandomDecimalFromInterval(0.4, 0.6);
  const gap = range(0.4, 1.6, 0.02, 0.015, radius);
  const count = pickRandomIntFromInterval(6, 36);
  const color =
    bgType === BgType.Light
      ? pickRandom(DARK_COLORS)
      : pickRandom(LIGHT_COLORS);
  const hasSameDepth = pickRandomBoolean();
  const uniDepth = pickRandomDecimalFromInterval(2, 3);

  return {
    grooves: new Array(count).fill(null).map(() => ({
      thetaStart: groovesSides[outerIndex],
      radius,
      depth: hasSameDepth ? uniDepth : pickRandomDecimalFromInterval(2, 3),
      color: hasMixedColors ? pickRandom(COLORS) : color,
      gap,
      width,
    })),
  };
});

/****************************************************** */

const strobesCount =
  bgType === BgType.Light
    ? 0
    : masterType === MasterAmplificationType.DarkLitStrobes || hasFog
    ? pickRandom([2, 3, 4])
    : pickRandom([0, 0, 0, pickRandom([1, 2])]);
const strobesSides = getSides(strobesCount, remainingSides);
const strobes = new Array(strobesCount).fill(null).map((_, outerIndex) => {
  const anglePower = pickRandomDecimalFromInterval(4, 5);
  const angle = pickRandomDecimalFromInterval(3, 4);
  const color = pickRandom(LIGHT_COLORS);

  return {
    angle,
    anglePower,
    color,
    targetX: Math.round(12 * Math.cos(strobesSides[outerIndex]) * 100) / 100,
    targetY: Math.round(12 * Math.sin(strobesSides[outerIndex]) * 100) / 100,
  };
});

/****************************************************** */

const circleCount = pickRandom([0, 1, 2, 3]);
const circles = new Array(circleCount).fill(null).map(() => {
  const distort = pickRandomDecimalFromInterval(0, 0.5);
  const thetaStart = pickRandom([
    ...primaryRingSides.map((o) => o.ringSections[0].thetaStart),
    ...secondaryRingSides.map((o) => o.ringSections[0].thetaStart),
    ...tertiaryRingSides.map((o) => o.ringSections[0].thetaStart),
    ...quaternaryRingSides.map((o) => o.ringSections[0].thetaStart),
  ]);
  const rotation = pickRandomDecimalFromInterval(
    thetaStart - 0.5,
    thetaStart + 0.5,
    3
  );

  return {
    rotation,
    distort,
    radius: pickRandomDecimalFromInterval(2, 6),
    color: pickRandom(COLORS),
  };
});

const RingSection = ({
  outerIndex,
  innerIndex,
  innerRadius,
  outerRadius,
  section,
  springRotation,
}: {
  outerIndex: number;
  innerIndex: number;
  innerRadius: number;
  outerRadius: number;
  section: RingSectionData;
  springRotation: SpringValue<number[]>;
}) => {
  const texture = useTexture({
    map: `${process.env.PUBLIC_URL}/texture.jpg`,
  });
  const texture2 = useTexture({
    map: `${process.env.PUBLIC_URL}/texture2.jpg`,
  });
  const texture3 = useTexture({
    map: `${process.env.PUBLIC_URL}/texture3.jpg`,
  });

  return (
    // @ts-ignore
    <a.mesh rotation={springRotation}>
      <ringGeometry
        args={[
          innerRadius,
          outerRadius,
          64,
          64,
          ringAltStart === RingSectionAltStart.Default
            ? section.thetaStart
            : ringAltStart === RingSectionAltStart.DoubleSpiral
            ? section.thetaStart + innerIndex * (Math.PI / (6 + outerIndex))
            : innerIndex * (Math.PI / 6),
          ringAltLength === RingSectionAltLength.Default
            ? section.length
            : ringAltLength === RingSectionAltLength.Irregular
            ? section.length + Math.PI / (6 + outerIndex)
            : Math.PI / (6 + outerIndex),
        ]}
      />
      {section.type === RingSectionTypes.Filled ? (
        hasGradient && !isMobileSafari && section.color === primaryColor ? (
          <meshStandardMaterial
            transparent
            opacity={section.opacity}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          >
            <GradientTexture
              stops={[0, 1]}
              colors={[primaryColor, secondaryColor]}
              size={1024}
            />
          </meshStandardMaterial>
        ) : (
          <meshStandardMaterial
            transparent
            opacity={section.opacity}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            color={section.color}
          />
        )
      ) : section.type === RingSectionTypes.Textured ? (
        <meshStandardMaterial
          transparent
          opacity={section.opacity}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          color={section.color}
          map={
            section.texture === 0
              ? texture.map
              : section.texture === 1
              ? texture2.map
              : texture3.map
          }
        />
      ) : (
        <>
          <meshBasicMaterial transparent opacity={0} />
          <Edges scale={1} color={section.strokeColor} />
        </>
      )}
    </a.mesh>
  );
};

const Scene = ({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement> }) => {
  const { aspect } = useThree((state) => ({
    aspect: state.viewport.aspect,
  }));

  const spotLightRefs = useRef<any[]>([]);

  const [cameraSprings, setCameraSprings] = useSpring(() => ({
    position: [cameraPosition.x, cameraPosition.y, cameraPosition.z],
  }));

  const [primarySidesSpring, setPrimarySidesSpring] = useSprings(
    primaryRingSides[0].ringSections.length,
    () => ({
      rotation: [0, 0, 0],
    })
  );

  const [secondarySidesSpring, setSecondarySidesSpring] = useSprings(
    secondaryRingSides[0].ringSections.length,
    () => ({
      rotation: [0, 0, 0],
    })
  );

  const [tertiarySidesSpring, setTertiarySidesSpring] = useSprings(
    tertiaryRingSides[0].ringSections.length,
    () => ({
      rotation: [0, 0, 0],
    })
  );

  const [quaternarySidesSpring, setQuaternarySidesSpring] = useSprings(
    quaternaryRingSides[0].ringSections.length,
    () => ({
      rotation: [0, 0, 0],
    })
  );

  const [strobeSprings, setStrobeSprings] = useSprings(strobesCount, (i) => ({
    rotation: strobesSides[i],
  }));

  const [grooveGapSprings, setGrooveGapSprings] = useSprings(
    groovesCount,
    (i) => ({
      gap: grooves[i].grooves[0].gap,
    })
  );

  const [grooveScaleSprings, setGrooveScaleSprings] = useSprings(36, (i) => ({
    scale: [1, 1, 1],
  }));

  const [spikeScaleSprings, setSpikeScaleSprings] = useSprings(18, (i) => ({
    scale: [1, 1, 1],
  }));

  const [circleSprings, setCircleSprings] = useSprings(circleCount, (i) => ({
    rotation: [0, 0, circles[i].rotation],
  }));

  const setStrobeLights = useCallback(() => {
    spotLightRefs.current = spotLightRefs.current.slice(0, strobesCount);

    strobes.forEach((strobe, i) => {
      if (!spotLightRefs.current[i]) {
        return;
      }

      const rotation =
        strobeSprings && strobeSprings[i] && strobeSprings[i].rotation
          ? strobeSprings[i].rotation.get()
          : strobesSides[i];

      const targetX = Math.round(12 * Math.cos(rotation) * 100) / 100;
      const targetY = Math.round(12 * Math.sin(rotation) * 100) / 100;

      spotLightRefs.current[i].target.position.set(targetX, targetY, 0.5);
      spotLightRefs.current[i].target.updateMatrixWorld();
    });
  }, [strobeSprings]);

  useLayoutEffect(() => {
    setStrobeLights();
  }, [setStrobeLights]);

  useFrame(() => {
    setStrobeLights();
  });

  const groovesMovingForward = useRef(true);
  const animateGrooves = useCallback(() => {
    setGrooveScaleSprings.start((i) => ({
      scale: groovesMovingForward.current
        ? [1, 1, pickRandomDecimalFromInterval(0.5, 1.5, 2, Math.random)]
        : [1, 1, 1],
      onRest: () => {
        if (i === 35) {
          groovesMovingForward.current = !groovesMovingForward.current;
          animateGrooves();
        }
      },
      delay: i * 20,
      config: { mass: 3, tension: 100, friction: 25 },
    }));
  }, [setGrooveScaleSprings]);

  const animateSpikes = useCallback(() => {
    setSpikeScaleSprings.start((i) => ({
      from: { scale: [1, 1, spikeScaleSprings[i].scale.get()[2]] },
      to: {
        scale: [1, 1, pickRandomDecimalFromInterval(0.9, 1.1, 2, Math.random)],
      },
      loop: { reverse: true },
      config: { mass: 3, tension: 50, friction: 25 },
    }));
  }, [setSpikeScaleSprings, spikeScaleSprings]);

  useEffect(() => {
    animateGrooves();
    animateSpikes();
  }, [animateGrooves, animateSpikes]);

  const onPointerDown = useCallback(() => {
    setCameraSprings.start({
      position: [
        pickRandomDecimalFromInterval(-15, 15, 2, Math.random),
        pickRandomDecimalFromInterval(-15, 15, 2, Math.random),
        0,
      ],
      config: { mass: 3, tension: 120, friction: 25 },
    });

    setPrimarySidesSpring.start((i) => ({
      rotation: [
        0,
        0,
        pickRandomDecimalFromInterval(
          primarySidesSpring[i].rotation.get()[2] - Math.PI,
          primarySidesSpring[i].rotation.get()[2] + Math.PI,
          2,
          Math.random
        ),
      ],
      delay: i * 20,
      config: { mass: 3, tension: 100, friction: 25 },
    }));
    setSecondarySidesSpring.start((i) => ({
      rotation: [
        0,
        0,
        pickRandomDecimalFromInterval(
          secondarySidesSpring[i].rotation.get()[2] - Math.PI,
          secondarySidesSpring[i].rotation.get()[2] + Math.PI,
          2,
          Math.random
        ),
      ],
      delay: i * 20,
      config: { mass: 3, tension: 100, friction: 25 },
    }));
    setTertiarySidesSpring.start((i) => ({
      rotation: [
        0,
        0,
        pickRandomDecimalFromInterval(
          tertiarySidesSpring[i].rotation.get()[2] - Math.PI,
          tertiarySidesSpring[i].rotation.get()[2] + Math.PI,
          2,
          Math.random
        ),
      ],
      delay: i * 20,
      config: { mass: 3, tension: 100, friction: 25 },
    }));
    setQuaternarySidesSpring.start((i) => ({
      rotation: [
        0,
        0,
        pickRandomDecimalFromInterval(
          quaternarySidesSpring[i].rotation.get()[2] - Math.PI,
          quaternarySidesSpring[i].rotation.get()[2] + Math.PI,
          2,
          Math.random
        ),
      ],
      delay: i * 20,
      config: { mass: 3, tension: 100, friction: 25 },
    }));

    setStrobeSprings.start((i) => ({
      rotation: pickRandomDecimalFromInterval(
        strobeSprings && strobeSprings[i] && strobeSprings[i].rotation
          ? strobeSprings[i].rotation.get() - Math.PI / 8
          : strobesSides[i] - Math.PI / 8,
        strobeSprings && strobeSprings[i] && strobeSprings[i].rotation
          ? strobeSprings[i].rotation.get() + Math.PI / 8
          : strobesSides[i] + Math.PI / 8,
        2,
        Math.random
      ),
      config: { mass: 3, tension: 100, friction: 25 },
    }));

    setGrooveGapSprings.start((i) => {
      const newRadius = pickRandomDecimalFromInterval(
        grooves[i].grooves[0].radius,
        3,
        2,
        Math.random
      );

      return {
        gap: range(0.4, 3, 0.02, 0.03, newRadius),
        config: { mass: 3, tension: 100, friction: 25 },
      };
    });

    setCircleSprings.start((i) => ({
      rotation: [
        0,
        0,
        pickRandomDecimalFromInterval(
          circleSprings[i].rotation.get()[2] - Math.PI / 8,
          circleSprings[i].rotation.get()[2] + Math.PI / 8,
          2,
          Math.random
        ),
      ],
      config: { mass: 3, tension: 100, friction: 25 },
    }));
  }, [
    setPrimarySidesSpring,
    setSecondarySidesSpring,
    setTertiarySidesSpring,
    setQuaternarySidesSpring,
    primarySidesSpring,
    secondarySidesSpring,
    tertiarySidesSpring,
    quaternarySidesSpring,
    setStrobeSprings,
    strobeSprings,
    setCameraSprings,
    setGrooveGapSprings,
    setCircleSprings,
    circleSprings,
  ]);

  useEffect(() => {
    const ref = canvasRef?.current;

    if (!ref) {
      return;
    }

    ref.addEventListener("pointerdown", onPointerDown);

    return () => {
      ref.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onPointerDown, canvasRef]);

  return (
    <>
      {bgType !== BgType.Light && (
        <color attach="background" args={[bgColor]} />
      )}
      {hasFog && <fog attach="fog" args={[fogColor, 5, 30]} />}
      <OrbitControls enabled={true} />
      <ambientLight
        intensity={
          masterType === MasterAmplificationType.DarkLitStrobes ? 0.1 : 1
        }
      />
      {/*
      // @ts-ignore */}
      <a.group
        {...cameraSprings}
        scale={[
          getSizeByAspect(1, aspect),
          getSizeByAspect(1, aspect),
          getSizeByAspect(1, aspect),
        ]}
      >
        {strobes.map((strobe, i) => (
          // @ts-ignore
          <SpotLight
            key={i}
            position={[0, 0, 0.5]}
            ref={(el) => (spotLightRefs.current[i] = el)}
            angle={strobe.angle}
            penumbra={1}
            intensity={10}
            distance={40}
            attenuation={isMobile ? 25 : 30}
            anglePower={strobe.anglePower}
            color={strobe.color}
          />
        ))}

        {primaryRingSides.map(({ ringSections }, outerIndex) => (
          <group key={outerIndex}>
            {ringSections.map((section, innerIndex) => (
              <RingSection
                key={innerIndex}
                section={section}
                outerIndex={outerIndex}
                innerIndex={innerIndex}
                innerRadius={innerIndex + 1}
                outerRadius={innerIndex + 2}
                springRotation={primarySidesSpring[innerIndex].rotation}
              />
            ))}
          </group>
        ))}

        {secondaryRingSides.map(({ ringSections }, outerIndex) => (
          <group key={outerIndex} position={[0, 0, 0.05]}>
            {ringSections.map((section, innerIndex) => (
              <RingSection
                key={innerIndex}
                section={section}
                outerIndex={outerIndex}
                innerIndex={innerIndex}
                innerRadius={innerIndex * 2 + 1}
                outerRadius={innerIndex * 2 + 3}
                springRotation={secondarySidesSpring[innerIndex].rotation}
              />
            ))}
          </group>
        ))}

        {tertiaryRingSides.map(({ ringSections }, outerIndex) => (
          <group key={outerIndex} position={[0, 0, 0.1]}>
            {ringSections.map((section, innerIndex) => (
              <RingSection
                key={innerIndex}
                section={section}
                outerIndex={outerIndex}
                innerIndex={innerIndex}
                innerRadius={innerIndex * 4 + 1}
                outerRadius={innerIndex * 4 + 5}
                springRotation={tertiarySidesSpring[innerIndex].rotation}
              />
            ))}
          </group>
        ))}

        {quaternaryRingSides.map(({ ringSections }, outerIndex) => (
          <group key={outerIndex} position={[0, 0, 0.15]}>
            {ringSections.map((section, innerIndex) => (
              <RingSection
                key={innerIndex}
                section={section}
                outerIndex={outerIndex}
                innerIndex={innerIndex}
                innerRadius={innerIndex * 8 + 1}
                outerRadius={innerIndex * 8 + 9}
                springRotation={quaternarySidesSpring[innerIndex].rotation}
              />
            ))}
          </group>
        ))}

        {spikes.map((spike, i) => (
          <group key={i} position={[0, 0, -0.05]}>
            {spike.spikes.map((o, ii) => (
              <Spikes
                key={ii}
                index={ii}
                radius={0.05}
                {...o}
                cameraPosition={cameraSprings.position}
                scale={spikeScaleSprings[ii].scale}
              />
            ))}
          </group>
        ))}

        {grooves.map((groove, i) => (
          <group key={i} position={[0, 0, i * -0.01]}>
            {groove.grooves.map((o, ii) => (
              <Grooves
                key={ii}
                index={ii}
                {...o}
                cameraPosition={cameraSprings.position}
                scale={grooveScaleSprings[ii].scale}
                gap={grooveGapSprings[i].gap}
              />
            ))}
          </group>
        ))}

        {circles.map((circle, i) => (
          // @ts-ignore
          <a.group key={i} rotation={circleSprings[i].rotation}>
            <mesh position={[10, -10, -0.1]}>
              <circleGeometry args={[circle.radius, 128, 128]} />
              <MeshDistortMaterial
                transparent
                opacity={0.5}
                blending={AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
                color={circle.color}
                speed={0}
                distort={circle.distort}
              />
            </mesh>
          </a.group>
        ))}
      </a.group>
      {hasPointsBackground && <Points type={pointsBackgroundType} />}
      {hasStripeBackground && <StripeBackground />}
    </>
  );
};

export default Scene;
