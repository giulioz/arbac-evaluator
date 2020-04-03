import { Policy } from "./parser";

type RolesSet = { [key: string]: string[] };

function buildInitialRoles(policy: Policy): RolesSet {
  const rolesForUsers = {};

  policy.users.forEach((user) =>
    policy.userRoles.forEach((role) => {
      if (role.user === user) {
        rolesForUsers[user] = [...(rolesForUsers[user] || []), role.role];
      }
    })
  );

  return rolesForUsers;
}

function applyAssign(rolesSet: RolesSet, user: string, role: string) {
  const result: RolesSet = { ...rolesSet };

  let done = false;

  Object.keys(rolesSet).forEach((u) => {
    if (user === u) {
      const added = Array.from(new Set([...rolesSet[u], role]));
      if (added.length > result[u].length) {
        result[u] = added;
        done = true;
      }
    }
  });

  if (done) {
    return result;
  } else {
    return null;
  }
}

function applyRevocation(rolesSet: RolesSet, user: string, role: string) {
  const result: RolesSet = { ...rolesSet };

  let found = false;

  Object.keys(rolesSet).forEach((u) => {
    if (user === u) {
      const removed = rolesSet[u].filter((r) => r !== role);
      if (removed.length < result[u].length) {
        result[u] = removed;
        found = true;
      }
    }
  });

  if (found) {
    return result;
  } else {
    return null;
  }
}

function findUsersWithRole(rolesSet: RolesSet, role: string) {
  return Object.keys(rolesSet).filter(
    (user) => rolesSet[user] && rolesSet[user].find((r) => r === role)
  );
}

function step(rolesSet: RolesSet, policy: Policy) {
  console.log("STEP:", rolesSet);

  const hasReachedTargetState = Object.keys(rolesSet).find((user) => {
    const userRoles = rolesSet[user];
    return userRoles && userRoles.find((role) => role === policy.goal);
  });
  if (hasReachedTargetState) {
    return rolesSet;
  }

  const steps: RolesSet[] = [];

  // add all assign steps
  policy.canAssign.forEach((assign) => {
    const admins = findUsersWithRole(rolesSet, assign.roleAdmin);

    // if there is an admin, we may apply the assign
    if (admins.length > 0) {
      Object.keys(rolesSet).forEach((user) => {
        const targetUserRoles = rolesSet[user];
        const positiveConditionsCheck = assign.positiveConditions.every(
          (condRule) => targetUserRoles.find((role) => role === condRule)
        );
        const negativeConditionsCheck = assign.negativeConditions.some(
          (condRule) => targetUserRoles.find((role) => role === condRule)
        );

        const withAssign = applyAssign(rolesSet, user, assign.roleToAssign);

        if (withAssign && positiveConditionsCheck && !negativeConditionsCheck) {
          steps.push(withAssign);
        }
      });
    }
  });

  // add all revocation steps
  policy.canRevoke.forEach((revoke) => {
    const admins = findUsersWithRole(rolesSet, revoke.roleAdmin);

    // if there is an admin, we may apply the revocation
    if (admins.length > 0) {
      Object.keys(rolesSet).forEach((user) => {
        const withRevocation = applyRevocation(
          rolesSet,
          user,
          revoke.roleToRevoke
        );
        if (withRevocation) {
          steps.push(withRevocation);
        }
      });
    }
  });

  if (step.length > 0) {
    return steps.find((s) => step(s, policy));
  } else {
    return false;
  }
}

export default function isReachable(policy: Policy) {
  const initialRoles = buildInitialRoles(policy);
  console.log("INITIAL:", initialRoles);

  return step(initialRoles, policy);
}
