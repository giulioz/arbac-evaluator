export type Policy = {
  roles: string[];
  users: string[];
  userRoles: { user: string; role: string }[];
  canRevoke: { roleAdmin: string; roleToRevoke: string }[];
  canAssign: {
    roleAdmin: string;
    positiveConditions: string[];
    negativeConditions: string[];
    roleToAssign: string;
  }[];
  goal: string;
};

export default function parsePolicy(data: string): Policy {
  const policy: Policy = {
    roles: [],
    users: [],
    userRoles: [],
    canRevoke: [],
    canAssign: [],
    goal: "",
  };

  const lines = data.split("\n").filter((l) => l.trim().length > 0);

  lines.forEach((line) => {
    if (line.startsWith("Roles")) {
      policy.roles = line.trim().split(" ").slice(1, -1);
    } else if (line.startsWith("Users")) {
      policy.users = line.trim().split(" ").slice(1, -1);
    } else if (line.startsWith("UA")) {
      policy.userRoles = line
        .trim()
        .split(" ")
        .slice(1, -1)
        .filter((t) => t.length > 0)
        .map((uae) => {
          const [fst, snd] = uae.split(",");
          return { user: fst.substr(1), role: snd.substr(0, snd.length - 1) };
        });
    } else if (line.startsWith("CR")) {
      policy.canRevoke = line
        .trim()
        .split(" ")
        .slice(1, -1)
        .filter((t) => t.length > 0)
        .map((uae) => {
          const [fst, snd] = uae.split(",");
          return {
            roleAdmin: fst.substr(1),
            roleToRevoke: snd.substr(0, snd.length - 1),
          };
        });
    } else if (line.startsWith("CA")) {
      policy.canAssign = line
        .trim()
        .split(" ")
        .slice(1, -1)
        .map((uae) => {
          const [fst, mid, snd] = uae.split(",");
          return {
            roleAdmin: fst.substr(1),
            positiveConditions: mid
              .split("&")
              .filter((tok) => !tok.startsWith("-")),
            negativeConditions: mid
              .split("&")
              .filter((tok) => tok.startsWith("-"))
              .map((tok) => tok.substr(1)),
            roleToAssign: snd.substr(0, snd.length - 1),
          };
        });
    } else if (line.startsWith("Goal")) {
      policy.goal = line.trim().split(" ")[1];
    }
  });

  return policy;
}
