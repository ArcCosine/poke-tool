import ort from 'onnxruntime-web';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const detModelPath = path.resolve(__dirname, '../public/models/det.onnx');
const parseqModelPath = path.resolve(__dirname, '../public/models/parseq-ndl-30.onnx');

async function inspectModels() {
  try {
    console.log('Inspecting det.onnx...');
    const detSession = await ort.InferenceSession.create(detModelPath);
    console.log('det.onnx Input Names:', detSession.inputNames);
    console.log('det.onnx Output Names:', detSession.outputNames);
    // Print input/output detail if available
    for (const name of detSession.inputNames) {
      console.log(`Input "${name}" detail:`, detSession.handler?.inputNames);
    }

    console.log('\nInspecting parseq-ndl-30.onnx...');
    const parseqSession = await ort.InferenceSession.create(parseqModelPath);
    console.log('parseq-ndl-30.onnx Input Names:', parseqSession.inputNames);
    console.log('parseq-ndl-30.onnx Output Names:', parseqSession.outputNames);
    
    // We can infer dimensions by running a dummy tensor of shape [1, 3, 16, 256]
    const dummyInput = new Float32Array(1 * 3 * 16 * 256);
    const tensor = new ort.Tensor('float32', dummyInput, [1, 3, 16, 256]);
    
    const feeds = {};
    feeds[parseqSession.inputNames[0]] = tensor;
    const outputs = await parseqSession.run(feeds);
    
    const outputTensor = outputs[parseqSession.outputNames[0]];
    console.log('parseq-ndl-30.onnx Output Tensor dimensions:', outputTensor.dims);
    console.log(`vocabSize is ${outputTensor.dims[2]}`);
    
  } catch (error) {
    console.error('Error inspecting models:', error);
  }
}

inspectModels();
