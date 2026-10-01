pipeline {

    agent {
        label 'website-application'
    }

    options {
        skipDefaultCheckout(true)
    }

    environment {
        BRANCH = 'main'

        PROJECT_DIR  = '/home/ubuntu/website-application'
        FRONTEND_DIR = "${PROJECT_DIR}/WBA_FRONTEND"
        BACKEND_DIR  = "${PROJECT_DIR}/WBA_BACKEND"
    }

    stages {

        // ============================================================
        // Checkout
        // ============================================================

        stage('Checkout') {
            steps {

                dir("${PROJECT_DIR}") {

                    checkout([
                        $class: 'GitSCM',

                        branches: [[
                            name: "*/${BRANCH}"
                        ]],

                        userRemoteConfigs: [[
                            url: 'https://github.com/Divakardii-Dev/website-application.git',
                            credentialsId: 'wba-token'
                        ]]
                    ])
                }
            }
        }


        // ============================================================
        // Configure Environment
        // ============================================================

        stage('Configure Environment') {
            steps {

                withCredentials([

                    file(
                        credentialsId: 'wba-env-backend',
                        variable: 'BACKEND_ENV'
                    ),

                    file(
                        credentialsId: 'wba-env-frontend',
                        variable: 'FRONTEND_ENV'
                    )

                ]) {

                    sh '''
                        echo "Configuring environment files..."

                        install -m 600 \
                            "$BACKEND_ENV" \
                            "$PROJECT_DIR/.env"

                        install -m 600 \
                            "$FRONTEND_ENV" \
                            "$FRONTEND_DIR/.env.local"

                        echo "Environment files configured successfully."
                    '''
                }
            }
        }


        // ============================================================
        // Build Docker Images
        // ============================================================

        stage('Build Docker Images') {
            steps {

                dir("${PROJECT_DIR}") {

                    sh '''
                        echo "Building Docker Compose images..."

                        docker compose build

                        echo "Docker images built successfully."
                    '''
                }
            }
        }


        // ============================================================
        // Deploy
        // ============================================================

        stage('Deploy') {
            steps {

                dir("${PROJECT_DIR}") {

                    sh '''
                        echo "Stopping existing containers..."

                        docker compose down

                        echo "Starting application containers..."

                        docker compose up -d

                        echo "Application containers started."
                    '''
                }
            }
        }


        // ============================================================
        // Verify Deployment
        // ============================================================

        stage('Verify Deployment') {
            steps {

                dir("${PROJECT_DIR}") {

                    sh '''
                        echo "Waiting for all containers to become healthy..."

                        EXPECTED=3
                        MAX_WAIT=180
                        INTERVAL=5
                        ELAPSED=0

                        while true; do

                            HEALTHY=$(docker compose ps \
                                --format '{{.Health}}' \
                                | grep -c '^healthy$' || true)

                            echo "Healthy containers: $HEALTHY/$EXPECTED"

                            if [ "$HEALTHY" -eq "$EXPECTED" ]; then
                                echo "All containers are healthy."
                                break
                            fi

                            if [ "$ELAPSED" -ge "$MAX_WAIT" ]; then

                                echo "ERROR: Containers did not become healthy within ${MAX_WAIT} seconds."

                                echo "========================================"
                                echo "Container Status"
                                echo "========================================"

                                docker compose ps

                                echo "========================================"
                                echo "Container Logs"
                                echo "========================================"

                                docker compose logs --tail=100

                                exit 1
                            fi

                            echo "Waiting ${INTERVAL} seconds..."

                            sleep "$INTERVAL"

                            ELAPSED=$((ELAPSED + INTERVAL))

                        done

                        echo "========================================"
                        echo "Deployment Verification Successful"
                        echo "========================================"

                        docker compose ps

                        echo "========================================"
                        echo "Docker Cleanup"
                        echo "========================================"

                        docker container prune -f
                        docker image prune -f

                        echo "Docker cleanup completed."

                        docker system df
                    '''
                }
            }
        }
    }


    // ================================================================
    // Post Actions
    // ================================================================

    post {

        success {
            echo '''
========================================
Docker Compose Deployment Successful
========================================

Application : Website Application
Branch      : main
Status      : All containers healthy

========================================
'''
        }

        failure {
            echo '''
========================================
Docker Compose Deployment Failed
========================================

Application : Website Application
Branch      : main
Status      : FAILED

Check the Jenkins console output and
Docker Compose logs for details.

========================================
'''
        }

        always {
            echo 'Jenkins deployment pipeline completed.'
        }
    }
}

