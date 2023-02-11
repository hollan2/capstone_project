import { Strategy } from "./strategy";

// alias the Strategy enum to s
import s = Strategy;
export const IdeoStratMap: Strategy[][] = [
    [s.Hawk, s.Hawk, s.Grim, s.Grim, s.Grim],
    [s.TweedleDum, s.TweedleDum, s.TweedleDee, s.TweedleDee, s.TweedleDee],
    [s.TweedleDum, s.TweedleDum, s.TweedleDee, s.TweedleDee, s.TweedleDee],
    [s.TweedleDum, s.TweedleDum, s.TitForTat, s.TitForTat, s.Dove],
    [s.AntiGrim, s.AntiGrim, s.TitForTat, s.TitForTat, s.Dove],
];
