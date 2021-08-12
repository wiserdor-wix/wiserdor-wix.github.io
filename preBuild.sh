if [[ ! $BRANCH =~ ^([a-zA-Z-]+)@([0-9]+\.[0-9]+\.x)$ ]]; then
  if [[ ! $agentType = "ci" ]] || [[ $BRANCH = "refs/heads/master" ]]; then
    exit 0 # regular build - exit with success so build will follow
  else
    echo "BRANCH($BRANCH) build argument was not set or differs than master/hotfix_* - failing build!"
    echo "Please open a ticket for CI to have Teamcity forward the branch environment argument"
    exit 1
  fi
else
  export artifact_name=${BASH_REMATCH[1]}
  echo match ${BASH_REMATCH[1]}
  echo "BRANCH: $BRANCH"
  echo "artifact_name: $artifact_name"
fi


if [ ! "$artifact_name" = "$(jq -r .name package.json)" ]; then
  echo "hotfix branch is different from artifact, skipping build"
  echo "##teamcity[setParameter name='env.system.goal' value='clean']"
  echo "##teamcity[setParameter name='env.SKIP_TRIGGER' value='true']"
else
  echo "hotfix branch, build proceed with the build"
  exit 0 #a hotfix for this component, exit with success so build will follow
fi
