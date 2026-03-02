pipeline {
    agent any

    parameters {
        booleanParam(name: 'ROLLBACK', defaultValue: false, description: 'Set true to rollback to previous version')
    }

    environment {
        APP_SERVER = 172.31.31.8
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    stages {

        stage('Checkout') {
            when { expression { !params.ROLLBACK } }
            steps {
                echo "Checking out code from Git..."
                checkout scm
            }
        }

        stage('Build Backend') {
            when { expression { !params.ROLLBACK } }
            steps {
                echo "Building NestJS backend..."
                dir('backend') {
                    sh 'npm install'
                    sh 'npm test -- --passWithNoTests || true'
                    sh 'npm run build'
                    stash includes: 'dist/**,package.json', name: 'backend-build'
                }
            }
        }

        stage('Build Frontend') {
            when { expression { !params.ROLLBACK } }
            steps {
                echo "Building React frontend..."
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm test -- --watchAll=false --passWithNoTests || true'
                    sh 'npm run build'
                    stash includes: 'build/**', name: 'frontend-build'
                }
            }
        }

        stage('Archive Artifacts') {
            when { expression { !params.ROLLBACK } }
            steps {
                echo "Archiving build artifacts..."
                dir('backend') {
                    archiveArtifacts artifacts: 'dist/**', fingerprint: true
                }
                dir('frontend') {
                    archiveArtifacts artifacts: 'build/**', fingerprint: true
                }
            }
        }

        stage('Deploy Backend') {
            when { expression { !params.ROLLBACK } }
            steps {
                echo "Deploying backend to app server..."
                dir('backend') {
                    unstash 'backend-build'
                    sh """
                        scp -o StrictHostKeyChecking=no -r dist/ package.json ${APP_SERVER}:/home/ec2-user/
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} 'bash /home/ec2-user/deploy_backend.sh'
                    """
                }
            }
        }

        stage('Deploy Frontend') {
            when { expression { !params.ROLLBACK } }
            steps {
                echo "Deploying frontend to app server..."
                dir('frontend') {
                    unstash 'frontend-build'
                    sh """
                        scp -o StrictHostKeyChecking=no -r build/ ${APP_SERVER}:/home/ec2-user/
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} 'bash /home/ec2-user/deploy_frontend.sh'
                    """
                }
            }
        }

        stage('Rollback') {
            when { expression { params.ROLLBACK } }
            steps {
                echo "Rolling back to previous version..."
                sh """
                    ssh -o StrictHostKeyChecking=no ${APP_SERVER} 'bash /home/ec2-user/rollback_backend.sh'
                """
            }
        }

        stage('Health Check') {
            when { expression { !params.ROLLBACK } }
            steps {
                echo "Running health check..."
                sh """
                    sleep 5
                    ssh -o StrictHostKeyChecking=no ${APP_SERVER} 'pm2 status'
                """
            }
        }
    }

    post {
        success {
            echo "✅ Deployment Successful! Build #${BUILD_NUMBER} is live."
        }
        failure {
            echo "❌ Deployment Failed! Check console output for errors."
        }
        always {
            echo "Pipeline finished. Build #${BUILD_NUMBER}"
        }
    }
}
